"use client";

import { useState } from "react";
import { PersonList } from "@/interfaces/politics";
import { ComparadorContent } from "./vs-destacado";

interface ComparadorProps {
  legisladores: PersonList[];
}

function getInitialPair(legisladores: PersonList[]): [PersonList, PersonList] {
  return [legisladores[0], legisladores[1]];
}

function getRandomPair(legisladores: PersonList[]): [PersonList, PersonList] {
  const shuffled = [...legisladores].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

export default function ComparadorSplit({ legisladores }: ComparadorProps) {
  const [legisladorA, setLegisladorA] = useState<PersonList>(
    () => getInitialPair(legisladores)[0],
  );
  const [legisladorB, setLegisladorB] = useState<PersonList>(
    () => getInitialPair(legisladores)[1],
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const selectRandomLegisladores = () => {
    setIsAnimating(true);
    const [newA, newB] = getRandomPair(legisladores);

    setTimeout(() => {
      setLegisladorA(newA);
      setLegisladorB(newB);
      setIsAnimating(false);
    }, 500);
  };

  return (
    <ComparadorContent
      legisladorA={legisladorA}
      legisladorB={legisladorB}
      isAnimating={isAnimating}
      onShuffleClick={selectRandomLegisladores}
    />
  );
}
