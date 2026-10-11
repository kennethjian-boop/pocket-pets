'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PetSprite } from '@/components/child/PetSprite';
import { EggArt } from '@/components/child/EggArt';
import { ConfirmSheet } from '@/components/child/ConfirmSheet';
import { Celebration } from '@/components/child/Celebration';
import { useChildState } from '@/app/child/_components/ChildStateProvider';
import { PET_ROSTER, mockRewards, type PetRosterItem, type Reward } from '@/lib/mock-data';
import { SECRET_EGG_COST, selectActivePet, setActiveSkin } from '@/lib/mission-state';
import { skinsByPet, type PetSkin, type PetType, type SkinId } from '@/lib/pet-skins';
import { buyScreenEnergy, buySecretEgg, buySkin, type EconomyResult } from '@/lib/child-economy';

type Tab = 'looks' | 'pets' | 'egg' | 'screen';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'looks', label: 'Looks', icon: 'sparkle' },
  { id: 'pets', label: 'Pets', icon: 'paw' },
  { id: 'egg', label: 'Egg', icon: 'egg' },
  { id: 'screen', label: 'Screen time', icon: 'energy' },
];

type Pending =
  | { kind: 'skin'; skin: PetSkin }
  | { kind: 'egg' }
  | { kind: 'energy'; reward: Reward }
  | null;

function lookName(skin: PetSkin, petName: string) {
  return skin.name.replace(new RegExp(`\\s*${petName}$`), '').trim();
}

export default function RewardShop() {
  const { child, state, applyState, notify } = useChildState();
  const [tab, setTab] = useState<Tab>('looks');
  const [lookPet, setLookPet] = useState<PetType | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [buying, setBuying] = useState(false);
  const buyingRef = useRef(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (TABS.some((t) => t.id === hash)) setTab(hash as Tab);
    };
    const t = window.setTimeout(fromHash, 0);
    window.addEventListener('hashchange', fromHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', fromHash);
    };
  }, []);

  const activePet = state.activePetId as PetType;
  const browsingPet: PetType = lookPet ?? activePet;
  const owned = (pet: PetType) => state.unlockedPets.includes(pet);
  const egg = state.activeEgg;
  const hasActiveEgg = Boolean(egg && !egg.hatched);
  const ownsAllPets = PET_ROSTER.every((p) => owned(p.id));

  const finish = (result: EconomyResult, success: string) => {
    applyState(result.state);
    if (result.ok) {
      setBurst((b) => b + 1);
      notify(success, 'celebrate');
    } else {
      notify(result.message, result.code === 'insufficient' ? 'warning' : 'info');
    }
  };

  const confirmPurchase = async () => {
    if (!pending || buyingRef.current) return;
    buyingRef.current = true;
    setBuying(true);
    try {
      if (pending.kind === 'skin') {
        const pet = PET_ROSTER.find((p) => p.id === pending.skin.petType);
        finish(await buySkin(child, pending.skin.id), `${lookName(pending.skin, pet?.name ?? '')} look unlocked!`);
      } else if (pending.kind === 'egg') {
        finish(await buySecretEgg(child), 'Your Secret Egg is ready to hatch!');
      } else {
        const amount = pending.reward.effectAmount ?? 1;
        finish(
          await buyScreenEnergy(child, pending.reward.cost, amount),
          `+${amount} Screen Energy! That's ${amount * 10} more minutes.`
        );
      }
    } finally {
      buyingRef.current = false;
      setBuying(false);
      setPending(null);
    }
  };

  const toggleSkin = (skin: PetSkin) => {
    const wearing = state.activeSkins[skin.petType] === skin.id;
    const next = setActiveSkin(child.id, child, skin.petType, wearing ? null : skin.id);
    applyState(next);
    const petName = PET_ROSTER.find((p) => p.id === skin.petType)?.name ?? 'Your pet';
    notify(wearing ? `${petName} is back to their cozy self.` : `${petName} is wearing ${lookName(skin, petName)}!`, 'success');
  };

  const choosePet = (pet: PetRosterItem) => {
    if (!owned(pet.id)) {
      notify('Hatch a Secret Egg to meet this pet!', 'info');
      return;
    }
    applyState(selectActivePet(child.id, child, pet.id));
    setLookPet(null);
    notify(`${pet.name} is playing with you now!`, 'success');
  };

  const pendingCost =
    pending?.kind === 'skin' ? pending.skin.cost : pending?.kind === 'egg' ? SECRET_EGG_COST : pending?.reward.cost ?? 0;
  const pendingTitle =
    pending?.kind === 'skin'
      ? `Buy the ${lookName(pending.skin, PET_ROSTER.find((p) => p.id === pending.skin.petType)?.name ?? '')} look?`
      : pending?.kind === 'egg'
        ? 'Buy a Secret Egg?'
        : pending?.kind === 'energy'
          ? `Buy ${pending.reward.effectAmount} Screen Energy?`
          : '';

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-6 pt-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none fixed inset-0 z-40">
        <Celebration show={burst > 0} burstKey={burst} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Magic Shop</h1>
          <p className="text-sm font-bold text-ink-soft">Spend your stars on something special</p>
        </div>
      </div>

      <div role="tablist" aria-label="Shop sections" className="surface-flat no-scrollbar mt-4 grid grid-cols-4 gap-1 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              history.replaceState(null, '', `#${t.id}`);
            }}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 font-display text-sm font-semibold transition sm:flex-row sm:gap-2 sm:text-base ${
              tab === t.id ? 'bg-white text-plum-600 shadow-soft' : 'text-ink-soft'
            }`}
          >
            <Icon name={t.icon} size={26} className={t.id === 'pets' ? 'text-plum-500' : ''} />
            <span className="leading-none">{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4">
        {tab === 'looks' ? (
          <section aria-label="Pet looks">
            <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
              {[...PET_ROSTER]
                .sort((a, b) => Number(b.id === activePet) - Number(a.id === activePet) || Number(owned(b.id)) - Number(owned(a.id)))
                .map((pet) => {
                const selected = browsingPet === pet.id;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setLookPet(pet.id)}
                    aria-pressed={selected}
                    className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-4 font-display text-base font-semibold transition ${
                      selected ? 'bg-plum-500 text-white shadow-soft' : 'bg-white/80 text-ink'
                    }`}
                  >
                    <span className="relative h-10 w-10 overflow-hidden rounded-full bg-white">
                      <PetSprite pet={pet.id} mood="happy" idle={false} shadow={false} sizes="48px" grayscale={!owned(pet.id)} className="h-full w-full" />
                    </span>
                    {pet.name}
                    {!owned(pet.id) ? <Icon name="lock" size={18} /> : null}
                  </button>
                );
              })}
            </div>

            {!owned(browsingPet) ? (
              <p className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink-soft">
                <Icon name="egg" size={26} /> Hatch a Secret Egg to meet this pet — then you can dress them up!
              </p>
            ) : null}

            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {skinsByPet[browsingPet].map((skin) => {
                const petName = PET_ROSTER.find((p) => p.id === skin.petType)?.name ?? '';
                const isOwned = state.ownedSkins.includes(skin.id as SkinId);
                const wearing = state.activeSkins[skin.petType] === skin.id;
                const petOwned = owned(skin.petType);
                const short = state.stars < skin.cost;
                return (
                  <li key={skin.id} className={`surface relative flex flex-col overflow-hidden p-2.5 ${wearing ? 'ring-4 ring-mint-300' : ''}`}>
                    <div className={`relative aspect-square overflow-hidden rounded-[1.25rem] sm:aspect-[4/5] ${isOwned ? 'bg-gradient-to-b from-plum-100 to-peach-100' : 'bg-gradient-to-b from-cream to-white'}`}>
                      <Image
                        src={skin.imagePath}
                        alt={skin.name}
                        fill
                        sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
                        className={`object-contain p-1 transition ${petOwned ? '' : 'grayscale opacity-40'}`}
                      />
                      {wearing ? (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-mint-500 px-2 py-0.5 text-xs font-extrabold text-white">
                          <Icon name="check" size={14} /> Wearing
                        </span>
                      ) : isOwned ? (
                        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-extrabold text-plum-600">Yours</span>
                      ) : null}
                      {!petOwned ? (
                        <span className="absolute inset-0 grid place-items-center">
                          <Icon name="lock" size={40} />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] px-0.5 text-center font-display text-[15px] font-semibold leading-tight text-ink">
                      {lookName(skin, petName)}
                    </p>
                    <div className="mt-2">
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => toggleSkin(skin)}
                          className={`btn-chunky w-full min-h-11 text-base ${wearing ? 'btn-paper' : 'btn-mint'}`}
                        >
                          {wearing ? 'Take off' : 'Wear'}
                        </button>
                      ) : petOwned ? (
                        <button
                          type="button"
                          onClick={() => (short ? notify(`You need ${skin.cost - state.stars} more stars for this look.`, 'info') : setPending({ kind: 'skin', skin }))}
                          aria-disabled={short}
                          className={`btn-chunky w-full min-h-11 text-base ${short ? 'btn-paper opacity-70' : 'btn-honey'}`}
                        >
                          <Icon name="star" size={20} /> {skin.cost}
                        </button>
                      ) : (
                        <span className="flex min-h-11 items-center justify-center rounded-2xl bg-ink/5 text-sm font-extrabold text-ink-faint">Locked</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-center text-xs font-bold text-ink-faint">Looks are just for fun — they don&apos;t change quests, rewards or mood.</p>
          </section>
        ) : null}

        {tab === 'pets' ? (
          <section aria-label="Pet collection">
            <p className="mb-3 text-sm font-bold text-ink-soft">
              You have {PET_ROSTER.filter((p) => owned(p.id)).length} of {PET_ROSTER.length} pets
            </p>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PET_ROSTER.map((pet) => {
                const isOwned = owned(pet.id);
                const active = activePet === pet.id;
                return (
                  <li key={pet.id} className={`surface relative flex flex-col items-center overflow-hidden p-3 text-center ${active ? 'ring-4 ring-plum-300' : ''}`}>
                    <div className={`relative h-32 w-full rounded-[1.25rem] sm:h-40 ${isOwned ? 'bg-gradient-to-b from-sky-100 to-mint-50' : 'bg-gradient-to-b from-plum-100 to-plum-50'}`}>
                      {isOwned ? (
                        <div className="absolute inset-2">
                          <PetSprite pet={pet.id} mood="happy" skinId={state.activeSkins[pet.id]} sizes="200px" className="h-full w-full" idle={active} />
                        </div>
                      ) : (
                        <div className="absolute inset-2">
                          <PetSprite pet={pet.id} mood="neutral" sizes="200px" idle={false} className="h-full w-full brightness-0 opacity-25" />
                          <span className="absolute inset-0 grid place-items-center font-display text-5xl font-semibold text-white drop-shadow">?</span>
                        </div>
                      )}
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold text-ink">{isOwned ? pet.name : 'Mystery pet'}</h2>
                    <p className="line-clamp-2 min-h-[2.25rem] text-xs font-bold text-ink-soft">
                      {isOwned ? pet.description : 'Hatch a Secret Egg to meet them!'}
                    </p>
                    <div className="mt-2 w-full">
                      {active ? (
                        <span className="flex min-h-11 items-center justify-center gap-1 rounded-2xl bg-plum-50 font-display text-base font-semibold text-plum-600">
                          <Icon name="heart" size={18} /> Playing now
                        </span>
                      ) : isOwned ? (
                        <button type="button" onClick={() => choosePet(pet)} className="btn-chunky btn-plum min-h-11 w-full text-base">
                          Play with {pet.name}
                        </button>
                      ) : (
                        <button type="button" onClick={() => setTab('egg')} className="btn-chunky btn-paper min-h-11 w-full text-sm">
                          <Icon name="egg" size={18} /> See the egg
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {tab === 'egg' ? (
          <section aria-label="Secret Egg" className="surface relative mx-auto max-w-xl overflow-hidden p-5 text-center sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-b from-plum-100/70 via-white/0 to-honey-100/60" aria-hidden="true" />
            <div className="relative">
              {hasActiveEgg && egg ? (
                <>
                  <EggArt progress={egg.progress} required={egg.requiredGoals} size={140} />
                  <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Your egg is hatching!</h2>
                  <p className="mt-1 text-base font-bold text-ink-soft">
                    Every quest a grown-up checks gives it a little warmth.
                  </p>
                  <div className="mx-auto mt-4 grid max-w-sm grid-cols-10 gap-1.5" aria-label={`${egg.progress} of ${egg.requiredGoals}`}>
                    {Array.from({ length: egg.requiredGoals }, (_, i) => (
                      <span key={i} className={`aspect-square rounded-full ${i < egg.progress ? 'bg-gradient-to-br from-plum-300 to-berry-300 shadow-inner' : 'bg-ink/10'}`} />
                    ))}
                  </div>
                  <p className="mt-2 font-display text-xl font-semibold text-plum-600">
                    {egg.progress} / {egg.requiredGoals} quests
                  </p>
                </>
              ) : ownsAllPets ? (
                <>
                  <Icon name="crown" size={96} />
                  <h2 className="mt-3 font-display text-3xl font-semibold text-ink">You found every pet!</h2>
                  <p className="mt-1 text-base font-bold text-ink-soft">What an amazing collection.</p>
                </>
              ) : (
                <>
                  {egg?.hatched && egg.unlockedPetId ? (
                    <p className="mb-3 rounded-2xl bg-mint-50 px-4 py-2 text-sm font-extrabold text-mint-700">
                      Your last egg hatched {PET_ROSTER.find((p) => p.id === egg.unlockedPetId)?.name}! Ready for another?
                    </p>
                  ) : null}
                  <EggArt progress={0} required={10} size={140} />
                  <h2 className="mt-3 font-display text-3xl font-semibold text-ink">Secret Egg</h2>
                  <p className="mx-auto mt-1 max-w-sm text-base font-bold text-ink-soft">
                    A mystery pet is inside! It hatches after 10 quests checked by a grown-up.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      state.stars < SECRET_EGG_COST
                        ? notify(`You need ${SECRET_EGG_COST - state.stars} more stars for the egg.`, 'info')
                        : setPending({ kind: 'egg' })
                    }
                    aria-disabled={state.stars < SECRET_EGG_COST}
                    className={`btn-chunky mx-auto mt-5 min-h-14 w-full max-w-xs text-xl ${state.stars < SECRET_EGG_COST ? 'btn-paper opacity-70' : 'btn-honey'}`}
                  >
                    <Icon name="star" size={26} /> {SECRET_EGG_COST}
                  </button>
                </>
              )}
            </div>
          </section>
        ) : null}

        {tab === 'screen' ? (
          <section aria-label="Screen time">
            <div className="surface-flat mb-3 flex items-center gap-3 p-4">
              <Icon name="energy" size={44} />
              <p className="text-base font-bold text-ink-soft">
                You have <span className="font-display text-xl text-sky-600">{state.screenEnergy}</span>{' '}Screen Energy —
                that&apos;s <span className="text-ink">{state.screenEnergy * 10} minutes</span> of weekend screen time.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {mockRewards
                .filter((r) => r.type === 'screen-energy')
                .map((reward) => {
                  const best = (reward.effectAmount ?? 1) > 1;
                  const short = state.stars < reward.cost;
                  return (
                    <li key={reward.id} className={`surface relative flex items-center gap-4 overflow-hidden p-4 ${best ? 'ring-4 ring-honey-200' : ''}`}>
                      {best ? (
                        <span className="absolute right-0 top-0 rounded-bl-2xl bg-honey-400 px-3 py-1 text-xs font-extrabold text-honey-700">Best value!</span>
                      ) : null}
                      <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-sky-50">
                        <Icon name="energy" size={52} />
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-sky-500 px-2 font-display text-sm font-semibold text-white">×{reward.effectAmount}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-semibold text-ink">{reward.effectAmount} Screen Energy</h2>
                        <p className="text-sm font-bold text-ink-soft">+{(reward.effectAmount ?? 1) * 10} min weekend screen time</p>
                        <button
                          type="button"
                          onClick={() => (short ? notify(`You need ${reward.cost - state.stars} more stars.`, 'info') : setPending({ kind: 'energy', reward }))}
                          aria-disabled={short}
                          className={`btn-chunky mt-2 min-h-11 px-4 text-base ${short ? 'btn-paper opacity-70' : 'btn-honey'}`}
                        >
                          <Icon name="star" size={20} /> {reward.cost}
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
            <p className="mt-4 text-center text-xs font-bold text-ink-faint">Saving up for the big bundle gets you more time for your stars.</p>
          </section>
        ) : null}
      </motion.div>

      <ConfirmSheet
        open={pending !== null}
        title={pendingTitle}
        cost={pendingCost}
        balance={state.stars}
        busy={buying}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmPurchase()}
        note={pending?.kind === 'egg' ? 'It hatches after 10 checked quests — not straight away!' : undefined}
        art={
          pending?.kind === 'skin' ? (
            <div className="relative h-36 w-32">
              <Image src={pending.skin.imagePath} alt="" fill sizes="128px" className="object-contain" />
            </div>
          ) : pending?.kind === 'egg' ? (
            <EggArt progress={0} required={10} size={84} />
          ) : pending?.kind === 'energy' ? (
            <Icon name="energy" size={72} />
          ) : null
        }
      />
    </div>
  );
}
