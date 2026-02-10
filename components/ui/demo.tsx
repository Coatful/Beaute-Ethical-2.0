import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { MinimalistHero } from '@/components/ui/minimalist-hero';

const MinimalistHeroDemo = () => {
  const navLinks = [
    { label: 'HOME', href: '#' },
    { label: 'PRODUCT', href: '#' },
    { label: 'STORE', href: '#' },
    { label: 'ABOUT US', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#' },
    { icon: Instagram, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Linkedin, href: '#' },
  ];

  return (
    <MinimalistHero
      logoText="BEAUTE ETHICAL"
      navLinks={navLinks}
      mainText="Professional Korean skincare, curated for visible results."
      readMoreLink="#"
      imageSrc="/assets/images/Merikit/Azulene_Blue_1000_Ampoule__-removebg-preview.png"
      imageAlt="Azulene Blue 1000 Ampoule"
      overlayText={{
        part1: 'visible',
        part2: 'results.',
      }}
      socialLinks={socialLinks}
      locationText="Singapore"
    />
  );
};

export default MinimalistHeroDemo;
