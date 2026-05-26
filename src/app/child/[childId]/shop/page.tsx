'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getChild, mockRewards } from '@/lib/mock-data';
import { RewardCard } from '@/components/RewardCard';
import { StatCard } from '@/components/StatCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { motion } from 'framer-motion';

export default function RewardShop() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const child = getChild(childId);
  const [stars, setStars] = useState(child?.stars || 0);
  const [purchased, setPurchased] = useState<string | null>(null);

  if (!child) {
    return <div>Child not found</div>;
  }

  const handlePurchase = (rewardId: string, cost: number) => {
    if (stars >= cost) {
      setStars(stars - cost);
      setPurchased(rewardId);
      setTimeout(() => setPurchased(null), 2000);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 pb-32 px-4 pt-6">
      <motion.div
        className="max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🛍️ Reward Shop</h1>
          <motion.div animate={purchased ? { scale: 1.05 } : { scale: 1 }}>
            <StatCard
              label="Your Stars"
              value={stars}
              icon="⭐"
              color="yellow"
            />
          </motion.div>
        </motion.div>

        {/* Success Message */}
        {purchased && (
          <motion.div
            variants={itemVariants}
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
            className="bg-green-200 text-green-800 font-bold py-3 px-4 rounded-2xl mb-6 text-center"
          >
            🎉 Reward purchased!
          </motion.div>
        )}

        {/* Rewards Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
        >
          {mockRewards.map((reward) => (
            <motion.div
              key={reward.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RewardCard
                reward={reward}
                onPurchase={() => handlePurchase(reward.id, reward.cost)}
                hasEnoughStars={stars >= reward.cost}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Info Box */}
        <motion.div
          variants={itemVariants}
          className="bg-white bg-opacity-70 rounded-2xl p-6 border-2 border-yellow-200 shadow-lg mb-8"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Shop Info</h3>
          <p className="text-gray-700 text-sm mb-3">
            Collect stars by doing great things! Spend them on awesome rewards.
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <div>✓ Screen energy lets you enjoy your favorite shows</div>
            <div>✓ Cosmetics make your pet look magical</div>
            <div>✓ Secret eggs unlock new surprises</div>
          </div>
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
