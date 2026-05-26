'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChild, mockFamilyBoss, mockChildren } from '@/lib/mock-data';
import { BossCard } from '@/components/BossCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { motion } from 'framer-motion';

export default function FamilyBoss() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const child = getChild(childId);
  const [bossHealth, setBossHealth] = useState(mockFamilyBoss.currentHealth);
  const [contribution, setContribution] = useState(0);

  if (!child) {
    return <div>Child not found</div>;
  }

  const handleAttack = () => {
    const damage = Math.floor(Math.random() * 10) + 5; // Random 5-15 damage
    setBossHealth(Math.max(0, bossHealth - damage));
    setContribution(contribution + damage);
  };

  const totalFamilyHealth = mockChildren.reduce((acc) => acc + 10, 0);
  const totalContribution = mockChildren.reduce((acc) => acc + 15, 0);
  const familyProgress = (totalContribution / totalFamilyHealth) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const bossDefeated = bossHealth === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 pb-32 px-4 pt-6">
      <motion.div
        className="max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👾 Family Boss Battle</h1>
          <p className="text-gray-600">Work together to defeat the monster!</p>
        </motion.div>

        {/* Boss Card */}
        <motion.div
          variants={itemVariants}
          animate={bossDefeated ? { scale: [1, 1.1, 0.9] } : { y: [0, -5, 0] }}
          transition={{
            duration: bossDefeated ? 0.6 : 2,
            repeat: bossDefeated ? 0 : Infinity,
          }}
        >
            <BossCard
            name="Glitch Gremlin"
            emoji={mockFamilyBoss.emoji}
            imageSrc="/bosses/glitch-gremlin/Glitch Gremlin.png"
            imageAlt="Glitch Gremlin boss monster"
            description="Glitch Gremlin loves causing screen chaos, tangled cables, and endless distractions. Work together as a family to defeat it by making good choices, taking screen breaks, and completing your daily goals."
            currentHealth={bossHealth}
            maxHealth={mockFamilyBoss.maxHealth}
            reward={mockFamilyBoss.reward}
          />
        </motion.div>

        {/* Defeated Message */}
        {bossDefeated && (
          <motion.div
            variants={itemVariants}
            animate={{ scale: [0, 1, 1] }}
            transition={{ duration: 0.6 }}
            className="text-center my-8"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Boss Defeated!
            </h2>
            <p className="text-gray-600 mb-4">
              The family earned {mockFamilyBoss.reward.emoji} {mockFamilyBoss.reward.name}!
            </p>
          </motion.div>
        )}

        {/* Family Progress */}
        <motion.div
          variants={itemVariants}
          className="bg-white bg-opacity-70 rounded-2xl p-6 border-2 border-purple-200 shadow-lg mb-8 mt-8"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">👨‍👩‍👧 Family Progress</h3>

          {/* Individual Contributions */}
          <div className="space-y-4 mb-6">
            {mockChildren.map((c) => (
              <div key={c.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800">{c.name}</span>
                  <span className="text-sm text-gray-600">+15 damage</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden border border-gray-400">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-800">Total Progress</span>
              <span className="text-sm font-bold text-gray-800">
                {Math.round(familyProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden border-2 border-purple-400">
              <div
                className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${familyProgress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Attack Button */}
        {!bossDefeated && (
          <motion.div variants={itemVariants} className="mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAttack}
              className="w-full bg-gradient-to-br from-red-400 to-red-500 hover:shadow-xl text-white font-bold py-4 px-6 rounded-3xl text-xl shadow-lg transition-all"
            >
              ⚔️ Attack Boss
            </motion.button>
            <p className="text-center text-sm text-gray-600 mt-3">
              Deal 5-15 damage per attack
            </p>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg mb-8"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-2">💡 How It Works</h3>
          <ul className="text-gray-700 space-y-2 text-sm">
            <li>✓ Everyone in the family contributes to defeat the boss</li>
            <li>✓ Do good things to deal more damage</li>
            <li>✓ Work together to unlock family rewards</li>
            <li>✓ Celebrate your victory together!</li>
          </ul>
        </motion.div>

        {/* Back Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-full bg-gradient-to-br from-blue-300 to-blue-400 rounded-2xl py-3 font-bold text-blue-900 shadow-lg hover:shadow-xl transition-all"
        >
          ← Back Home
        </motion.button>
      </motion.div>

      <BottomNavigation type="child" />
    </div>
  );
}
