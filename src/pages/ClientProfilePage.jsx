import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ProfileView } from '../components/ProfileView';

export const ClientProfilePage = () => {
  const { userProfile, setStoredAuthUser } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <ProfileView user={userProfile} onUserUpdated={setStoredAuthUser} />
    </motion.div>
  );
};
