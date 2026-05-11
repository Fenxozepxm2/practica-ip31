import { useState, useEffect } from 'react';

export interface SpecialistProfileData {
  education: string[];
  description: string;
  selectedMethods: Array<{
    method: string;
    technique: string;
  }>;
}

const STORAGE_KEY = 'specialist_profile_data';

export function useSpecialistProfile(specialistId?: string) {
  const [profileData, setProfileData] = useState<SpecialistProfileData>({
    education: [
      'МГУ им. М.В. Ломоносова, факультет психологии',
      'Институт Гештальт-терапии'
    ],
    description: 'Общий стаж работы — 8 лет. Специализируюсь на работе с тревожными расстройствами, депрессией и сложностями в отношениях. В своей практике помогаю клиентам находить внутренние ресурсы, опираться на собственные силы и обретать гармонию с собой и окружающими.',
    selectedMethods: []
  });

  useEffect(() => {
    loadProfileData();
  }, [specialistId]);

  const loadProfileData = () => {
    const storageKey = specialistId ? `${STORAGE_KEY}_${specialistId}` : STORAGE_KEY;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setProfileData(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    }
  };

  const saveProfileData = (data: SpecialistProfileData) => {
    const storageKey = specialistId ? `${STORAGE_KEY}_${specialistId}` : STORAGE_KEY;
    localStorage.setItem(storageKey, JSON.stringify(data));
    setProfileData(data);
  };

  return {
    profileData,
    saveProfileData
  };
}
