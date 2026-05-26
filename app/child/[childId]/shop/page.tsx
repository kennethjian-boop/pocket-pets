'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PET_ROSTER, Reward, getChild, mockRewards, type PetRosterItem } from '@/lib/mock-data';
import { ChildPageFrame } from '@/app/child/_components/ChildSidebar';
import {
  SkinId,
  PetType,
  mergeWithDefaultChildState,
  SecretEggState,
  createSecretEgg,
  readChildDashboardState,
  saveChildDashboardState,
  selectActivePet,
  purchaseSkin,
  setActiveSkin,
} from '@/lib/mission-state';
import { skinsByPet, getSkinById, SKIN_COST } from '@/lib/pet-skins';

export default function RewardShop() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = params.childId as string;

  const child = getChild(childId);
  const [stars, setStars] = useState(child?.stars || 0);
  const [screenEnergy, setScreenEnergy] = useState(child?.screenEnergy || 0);
  const [ownedSkins, setOwnedSkins] = useState<SkinId[]>([]);
  const [activeSkins, setActiveSkins] = useState<Record<PetType, SkinId | null>>({
    luna: null, bubbo: null, mochi: null, ember: null,
  });
  const [unlockedPets, setUnlockedPets] = useState<Array<PetRosterItem['id']>>([]);
  const [activePetType, setActivePetType] = useState<PetRosterItem['id'] | ''>('');
  const [activeEgg, setActiveEgg] = useState<SecretEggState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);

  useEffect(() => {
    if (!child) return;

    const hydrateTimer = window.setTimeout(() => {
      const stored = mergeWithDefaultChildState(child, readChildDashboardState(child.id));
      setStars(stored.stars);
      setScreenEnergy(stored.screenEnergy);
      setOwnedSkins(stored.ownedSkins);
      setActiveSkins(stored.activeSkins);
      setUnlockedPets(stored.unlockedPets);
      setActivePetType(stored.activePetId);
      setActiveEgg(stored.activeEgg);
      if (stored.eggMessage) {
        setMessage(stored.eggMessage);
        window.setTimeout(() => setMessage(null), 2000);
      }
      setDashboardLoaded(true);
    }, 0);

    return () => window.clearTimeout(hydrateTimer);
  }, [child]);

  useEffect(() => {
    if (!child || searchParams.get('setEggProgress') !== '9') return;

    const timer = window.setTimeout(() => {
      const stored = mergeWithDefaultChildState(child, readChildDashboardState(child.id));
      const existingEgg = stored.activeEgg;
      const nextEgg: SecretEggState =
        existingEgg && !existingEgg.hatched
          ? { ...existingEgg, progress: 9, requiredGoals: 10, contributedGoalIds: existingEgg.contributedGoalIds.slice(0, 9) }
          : { id: `secret-egg-test-${child.id}`, type: 'secret-egg', progress: 9, requiredGoals: 10, contributedGoalIds: [], hatched: false, unlockedPetId: null };

      const nextState = saveChildDashboardState(child.id, child, { activeEgg: nextEgg, eggMessage: null });
      setStars(nextState.stars);
      setScreenEnergy(nextState.screenEnergy);
      setOwnedSkins(nextState.ownedSkins);
      setActiveSkins(nextState.activeSkins);
      setUnlockedPets(nextState.unlockedPets);
      setActivePetType(nextState.activePetId);
      setActiveEgg(nextState.activeEgg);
      setMessage('Secret Egg progress set to 9 / 10 for testing.');
      router.replace(`/child/${child.id}/shop`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [child, router, searchParams]);

  useEffect(() => {
    if (!child || !dashboardLoaded) return;

    saveChildDashboardState(child.id, child, {
      stars,
      screenEnergy,
      ownedSkins,
      activeSkins,
      unlockedPets,
      activePetId: activePetType || undefined,
      activePetType: activePetType || undefined,
      activeEgg,
    });
  }, [activeEgg, activePetType, activeSkins, child, dashboardLoaded, ownedSkins, stars, screenEnergy, unlockedPets]);

  if (!child) return <div>Child not found</div>;

  const showMessage = (nextMessage: string) => {
    setMessage(nextMessage);
    setTimeout(() => setMessage(null), 2500);
  };

  const handlePurchaseReward = (reward: Reward) => {
    if (stars < reward.cost) { showMessage('Not enough stars yet!'); return; }

    if (reward.type === 'egg') {
      const result = createSecretEgg(child.id, child);
      setStars(result.state.stars);
      setScreenEnergy(result.state.screenEnergy);
      setOwnedSkins(result.state.ownedSkins);
      setActiveSkins(result.state.activeSkins);
      setUnlockedPets(result.state.unlockedPets);
      setActivePetType(result.state.activePetId);
      setActiveEgg(result.state.activeEgg);
      showMessage(result.message);
      return;
    }

    if (reward.type === 'screen-energy') {
      const amount = reward.effectAmount ?? 1;
      setStars((s) => s - reward.cost);
      setScreenEnergy((e) => e + amount);
      showMessage(amount === 6 ? '+6 Screen Energy added! That is 60 minutes weekend screen time.' : '+1 Screen Energy added!');
      return;
    }
  };

  const handlePurchaseSkin = (skinId: SkinId) => {
    if (!child) return;
    const result = purchaseSkin(child.id, child, skinId);
    setStars(result.state.stars);
    setOwnedSkins(result.state.ownedSkins);
    showMessage(result.message);
  };

  const handleToggleSkin = (petType: PetType, skinId: SkinId) => {
    if (!child) return;
    const isActive = activeSkins[petType] === skinId;
    const nextSkinId = isActive ? null : skinId;
    const nextState = setActiveSkin(child.id, child, petType, nextSkinId);
    setActiveSkins(nextState.activeSkins);
    const skin = getSkinById(skinId);
    showMessage(isActive ? `${skin?.name ?? 'Look'} removed.` : `${skin?.name ?? 'Look'} equipped!`);
  };

  const handleChoosePet = (petId: PetRosterItem['id']) => {
    if (!unlockedPets.includes(petId)) { showMessage('Hatch a Secret Egg to unlock this pet!'); return; }
    const nextState = selectActivePet(child.id, child, petId);
    const petName = PET_ROSTER.find((p) => p.id === petId)?.name ?? 'Pet';
    setActivePetType(nextState.activePetId);
    showMessage(`${petName} is now your active pet!`);
  };

  const ownsAllPets = PET_ROSTER.every((p) => unlockedPets.includes(p.id));
  const hasActiveEgg = Boolean(activeEgg && !activeEgg.hatched);
  const hatchedPet = activeEgg?.unlockedPetId ? PET_ROSTER.find((p) => p.id === activeEgg.unlockedPetId) : undefined;
  const eggReward = mockRewards.find((r) => r.type === 'egg');
  const screenEnergyRewards = mockRewards.filter((r) => r.type === 'screen-energy');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <ChildPageFrame childId={childId}>
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 pt-6">
      <motion.div
        className="mx-auto max-w-[1400px] px-4 pb-10 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {message && (
          <motion.div
            key={message}
            variants={itemVariants}
            animate={{ scale: [1, 1.04, 1], opacity: [1, 0.85, 1] }}
            className="mb-5 rounded-2xl bg-green-200 px-4 py-3 text-center font-bold text-green-800 shadow-sm"
          >
            {message}
          </motion.div>
        )}

        {/* ── TOP HERO ROW ───────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="mb-6 grid gap-5 lg:grid-cols-[340px_1fr]"
        >
          {/* LEFT: Title + Currency */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">🛍️ Reward Shop</h1>
              <p className="mt-1 text-sm font-semibold text-amber-700">Your magical collectible boutique</p>
            </div>

            <div className="rounded-3xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-5 shadow-md">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Stars</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-6xl font-extrabold tabular-nums leading-none text-amber-600">{stars}</span>
                <span className="mb-1 text-3xl">⭐</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-amber-500">Spend on looks, screen time &amp; eggs</p>
            </div>

            <div className="rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-md">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Weekend Screen Energy</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-6xl font-extrabold tabular-nums leading-none text-blue-600">{screenEnergy}</span>
                <span className="mb-1 text-3xl">🔋</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-blue-500">{screenEnergy} energy = {screenEnergy * 10} min of screen time</p>
            </div>
          </div>

          {/* RIGHT: Secret Egg Hero */}
          <div className="flex flex-col rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white/90 to-pink-50 p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-purple-900">🥚 Secret Egg</h2>
              <p className="mt-1 text-sm font-semibold text-purple-500">
                Hatches after 10 parent-verified goals — unlocks a brand-new pet!
              </p>
            </div>

            {hasActiveEgg && activeEgg ? (
              <div className="flex flex-1 flex-col justify-center gap-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-extrabold text-purple-900">Hatching in progress…</h3>
                  <span className="shrink-0 rounded-full bg-purple-100 px-4 py-1.5 text-base font-extrabold text-purple-800">
                    {activeEgg.progress} / {activeEgg.requiredGoals}
                  </span>
                </div>
                <div className="h-6 overflow-hidden rounded-full bg-purple-100 shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(activeEgg.progress / activeEgg.requiredGoals) * 100}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                  />
                </div>
                <p className="rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
                  ✨ Each parent-verified daily goal adds 1 hatching progress.
                </p>
              </div>
            ) : activeEgg?.hatched && hatchedPet ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-emerald-50 p-5 text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[140px]">
                  <Image
                    src={hatchedPet.moodImages.happy}
                    alt={`${hatchedPet.name} happy`}
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-emerald-800">🎉 Egg Hatched!</h3>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">You unlocked {hatchedPet.name}!</p>
                </div>
                {activePetType !== hatchedPet.id ? (
                  <button
                    type="button"
                    onClick={() => handleChoosePet(hatchedPet.id)}
                    className="rounded-full bg-white px-6 py-2 text-sm font-extrabold text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-95"
                  >
                    Use {hatchedPet.name}
                  </button>
                ) : (
                  <div className="rounded-full bg-white px-6 py-2 text-sm font-extrabold text-emerald-700">
                    Current Pet ✓
                  </div>
                )}
              </div>
            ) : ownsAllPets ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-emerald-50 p-6 text-center">
                <div>
                  <p className="text-5xl">🌟</p>
                  <p className="mt-3 text-lg font-extrabold text-emerald-800">All Pets Unlocked!</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    You have collected every pet. Amazing!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                <div className="text-8xl">🥚</div>
                <div>
                  <p className="text-xl font-extrabold text-purple-900">Mysterious Egg</p>
                  <p className="mt-1 text-sm font-semibold text-purple-500">
                    Unlock a random hidden pet after 10 goals!
                  </p>
                </div>
                {eggReward && (
                  <motion.button
                    type="button"
                    whileHover={stars >= eggReward.cost ? { scale: 1.03, y: -2 } : undefined}
                    whileTap={stars >= eggReward.cost ? { scale: 0.97 } : undefined}
                    onClick={() => handlePurchaseReward(eggReward)}
                    disabled={stars < eggReward.cost}
                    className={`w-full max-w-[280px] rounded-2xl py-3.5 text-sm font-extrabold shadow-md transition ${
                      stars >= eggReward.cost
                        ? 'bg-gradient-to-r from-violet-400 to-pink-400 text-white hover:shadow-lg'
                        : 'cursor-not-allowed bg-slate-200 text-slate-400'
                    }`}
                  >
                    {stars >= eggReward.cost
                      ? `✨ Hatch Egg for ${eggReward.cost} ⭐`
                      : `Need ${eggReward.cost} ⭐ to hatch`}
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SCREEN ENERGY SHOP ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="mb-3 text-lg font-extrabold text-gray-800">⚡ Screen Energy Shop</h2>
          <div className="grid grid-cols-2 gap-4">
            {screenEnergyRewards.map((reward) => {
              const disabled = stars < reward.cost;
              return (
                <motion.button
                  key={reward.id}
                  type="button"
                  whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
                  whileTap={!disabled ? { scale: 0.97 } : undefined}
                  onClick={() => handlePurchaseReward(reward)}
                  className={`rounded-3xl border-2 p-5 text-left shadow-md transition ${
                    disabled
                      ? 'border-slate-200 bg-slate-100 text-slate-500'
                      : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 text-slate-900 hover:shadow-lg'
                  }`}
                >
                  <div className="mb-3 text-3xl">{reward.icon}</div>
                  <h3 className="text-base font-extrabold">{reward.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{reward.helperText}</p>
                  <div className="mt-3 flex w-fit items-center gap-1.5 rounded-full bg-yellow-200 px-3 py-1.5">
                    <span>⭐</span>
                    <span className="text-sm font-extrabold text-yellow-900">{reward.cost}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── PET LOOKS ──────────────────────────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          className="mb-6 rounded-3xl border-2 border-pink-200 bg-white/80 p-5 shadow-lg lg:p-6"
        >
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-gray-800">✨ Pet Looks</h2>
            <p className="mt-1 text-sm text-gray-500">
              Unlock special styles for your pets. Each look costs {SKIN_COST} ⭐.
            </p>
          </div>

          <div className="space-y-8">
            {PET_ROSTER.map((rosterPet) => {
              const skins = skinsByPet[rosterPet.id];
              const isActivePet = activePetType === rosterPet.id;
              const petUnlocked = unlockedPets.includes(rosterPet.id);
              return (
                <div key={rosterPet.id}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0">
                      <Image
                        src={rosterPet.moodImages.happy}
                        alt={rosterPet.name}
                        fill
                        className={`object-contain ${!petUnlocked ? 'grayscale opacity-50' : ''}`}
                        sizes="36px"
                      />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-800">{rosterPet.name}</h3>
                    {isActivePet && (
                      <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-extrabold text-pink-800">
                        Active Pet
                      </span>
                    )}
                    {!petUnlocked && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-500">
                        Locked
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {skins.map((skin) => {
                      const owned = ownedSkins.includes(skin.id);
                      const isActive = activeSkins[rosterPet.id] === skin.id;
                      const skinLabel = skin.name.replace(` ${rosterPet.name}`, '').trim();
                      return (
                        <div
                          key={skin.id}
                          className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center transition ${
                            isActive
                              ? 'border-pink-300 bg-gradient-to-b from-pink-50 to-violet-50 shadow-md'
                              : owned
                                ? 'border-violet-200 bg-violet-50'
                                : petUnlocked
                                  ? 'border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/40'
                                  : 'border-slate-100 bg-slate-50 opacity-60'
                          }`}
                        >
                          <div
                            className="relative mx-auto mb-2.5 w-full max-w-[88px] overflow-hidden rounded-xl"
                            style={{ aspectRatio: '4/5' }}
                          >
                            <Image
                              src={skin.imagePath}
                              alt={skin.name}
                              fill
                              loading="eager"
                              className={`object-contain ${!petUnlocked ? 'grayscale' : ''}`}
                              sizes="88px"
                            />
                          </div>
                          <p className="w-full text-xs font-extrabold leading-snug text-gray-800">
                            {skinLabel}
                          </p>

                          {owned ? (
                            isActivePet ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSkin(rosterPet.id, skin.id)}
                                className={`mt-2 w-full rounded-full py-1.5 text-xs font-extrabold transition active:scale-95 ${
                                  isActive
                                    ? 'bg-pink-200 text-pink-900 hover:bg-pink-300'
                                    : 'bg-violet-200 text-violet-900 hover:bg-violet-300'
                                }`}
                              >
                                {isActive ? '✓ Remove' : 'Wear'}
                              </button>
                            ) : (
                              <div className="mt-2 w-full rounded-full bg-slate-100 px-1 py-1.5 text-[10px] font-semibold leading-snug text-slate-500">
                                Switch to this pet
                              </div>
                            )
                          ) : petUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handlePurchaseSkin(skin.id)}
                              disabled={stars < skin.cost}
                              className="mt-2 w-full rounded-full bg-yellow-200 py-1.5 text-xs font-extrabold text-yellow-900 transition hover:bg-yellow-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              {stars < skin.cost ? `${skin.cost} ⭐` : `Buy ${skin.cost} ⭐`}
                            </button>
                          ) : (
                            <div className="mt-2 w-full rounded-full bg-slate-100 px-1 py-1.5 text-[10px] font-semibold leading-snug text-slate-400">
                              Unlock pet first
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── MY PETS ────────────────────────────────────────────────────── */}
        <motion.section
          variants={itemVariants}
          className="mb-6 rounded-3xl border-2 border-pink-200 bg-white/80 p-5 shadow-lg lg:p-6"
        >
          <h2 className="mb-4 text-xl font-extrabold text-gray-800">My Pets</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PET_ROSTER.map((rosterPet) => {
              const unlocked = unlockedPets.includes(rosterPet.id);
              const selected = activePetType === rosterPet.id;
              return (
                <div
                  key={rosterPet.id}
                  className={`rounded-2xl border-2 p-4 text-center transition ${
                    selected
                      ? 'border-pink-300 bg-gradient-to-b from-pink-50 to-rose-50 shadow-md'
                      : unlocked
                        ? 'border-slate-200 bg-slate-50 hover:border-pink-200'
                        : 'border-slate-200 bg-slate-100 opacity-75'
                  }`}
                >
                  <div className="relative mx-auto mb-2 aspect-square w-full max-w-[120px]">
                    <Image
                      src={rosterPet.moodImages.happy}
                      alt={`${rosterPet.name} pet`}
                      fill
                      className={`object-contain ${unlocked ? '' : 'grayscale'}`}
                      sizes="120px"
                    />
                  </div>
                  <div className="mt-1 text-base font-extrabold text-gray-800">{rosterPet.name}</div>
                  <p className="mt-1 text-xs font-semibold leading-snug text-slate-500">
                    {rosterPet.description}
                  </p>
                  <div
                    className={`mt-2 text-xs font-extrabold ${
                      selected ? 'text-pink-700' : unlocked ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {selected ? '✓ Current Pet' : unlocked ? 'Unlocked' : 'Locked'}
                  </div>
                  {unlocked && !selected ? (
                    <button
                      type="button"
                      onClick={() => handleChoosePet(rosterPet.id)}
                      className="mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-pink-800 shadow-sm transition hover:bg-pink-50 active:scale-95"
                    >
                      Use Pet
                    </button>
                  ) : !unlocked ? (
                    <div className="mt-3 text-xs font-bold text-slate-500">
                      Hatch a Secret Egg to unlock
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── SHOP GUIDE ─────────────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="mb-6 rounded-3xl border-2 border-yellow-200 bg-white/80 p-5 shadow-lg lg:p-6"
        >
          <h3 className="mb-4 text-lg font-extrabold text-gray-800">💡 Shop Guide</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: '⭐', title: 'Stars', desc: 'Buy looks, screen time and eggs with stars.' },
              { icon: '🔋', title: 'Screen Energy', desc: '1 energy = 10 minutes of weekend screen time.' },
              { icon: '💖', title: 'Hearts', desc: 'Hearts are special and cannot be spent here.' },
              { icon: '✨', title: 'Pet Looks', desc: 'Visual only — no effect on goals or egg progress.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-yellow-200 bg-amber-50 p-4">
                <p className="text-2xl">{icon}</p>
                <p className="mt-2 text-sm font-extrabold text-gray-800">{title}</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── BACK HOME ──────────────────────────────────────────────────── */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.back()}
          className="mb-4 w-full rounded-2xl bg-gradient-to-br from-blue-300 to-blue-400 py-3.5 font-bold text-blue-900 shadow-lg transition-all hover:shadow-xl"
        >
          ← Back Home
        </motion.button>
        </motion.div>
      </div>
    </ChildPageFrame>
  );
}
