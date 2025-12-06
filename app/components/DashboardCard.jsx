"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "@/app/styles/dashboardCard.module.css";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { usePredictionStore } from "@/app/store/Prediction";

import { RiBasketballLine as BasketballIcon } from "react-icons/ri";
import { IoFootball as FootballIcon } from "react-icons/io5";
import { MdOutlineSportsTennis as TennisIcon } from "react-icons/md";
import { BiSolidCrown as VipIcon } from "react-icons/bi";
import { PiCourtBasketball as BetOfTheDayIcon } from "react-icons/pi";
import { TbStars as ExtraIcon } from "react-icons/tb";

const ICON_MAP = {
  'bet-of-the-day': BetOfTheDayIcon,
  extra: ExtraIcon,
  football: FootballIcon,
  basketball: BasketballIcon,
  tennis: TennisIcon,
  vip: VipIcon,
};

export default function DashboardCard({ data }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCard = searchParams.get("card");
  const dateParam = searchParams.get("date");
  
  const { fetchPredictions, fetchPredictionCounts } = usePredictionStore();
  const [cardCounts, setCardCounts] = useState({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const updateUrlParams = useCallback((cardType, date = dateParam) => {
    const params = new URLSearchParams(searchParams);
    if (cardType) {
      params.set("card", cardType);
    }
    if (date) {
      params.set("date", date);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, dateParam]);

  useEffect(() => {
    if (!activeCard && data?.length > 0) {
      updateUrlParams(data[0].type);
    }
  }, [activeCard, data, updateUrlParams]);

  useEffect(() => {
    const preloadCardCounts = async () => {
      if (!dateParam) return;
      
      setIsLoadingCounts(true);
      
      try {
        const result = await fetchPredictionCounts(dateParam);
        
        if (result.success) {
          setCardCounts(result.counts || {});
        } else {
          console.error("Failed to fetch prediction counts:", result.message);
          setCardCounts({});
        }
      } catch (error) {
        console.error("Failed to preload card counts:", error);
        setCardCounts({});
      } finally {
        setIsLoadingCounts(false);
      }
    };

    preloadCardCounts();
  }, [dateParam, fetchPredictionCounts]);

  useEffect(() => {
    if (activeCard && dateParam) {
      fetchPredictions(dateParam, activeCard).then((result) => {
        if (!result.success && result.message) {
          console.error("Failed to fetch predictions:", result.message);
        }
      });
    }
  }, [activeCard, dateParam, fetchPredictions]);

  const handleCardClick = useCallback(async (cardType) => {
    updateUrlParams(cardType, dateParam);
    
    if (dateParam) {
      const result = await fetchPredictions(dateParam, cardType);
      
      if (!result.success && result.message) {
        console.error("Failed to fetch predictions:", result.message);
      }
    }
  }, [updateUrlParams, dateParam, fetchPredictions]);

  const getCardIcon = useCallback((cardType) => {
    const IconComponent = ICON_MAP[cardType];
    return IconComponent ? <IconComponent className={styles.cardIcon} alt={cardType} /> : null;
  }, []);

  const renderCardIcon = useCallback((card) => {
    return card.icon || getCardIcon(card.type);
  }, [getCardIcon]);

  const getCardCount = useCallback((card) => {
    if (cardCounts[card.type] !== undefined) {
      return cardCounts[card.type];
    }
    return card.available || 0;
  }, [cardCounts]);

  if (!data?.length) {
    return null;
  }

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashcardContainer}>
        {data.map((card, index) => (
          <div
            key={card.type || index}
            className={`${styles.dashcard} ${
              card.type === activeCard ? styles.dashcardactive : ""
            }`}
            onClick={() => handleCardClick(card.type)}
          >
            <div className={styles.iconWrapper}>
              <div className={styles.iconContainer}>
                {renderCardIcon(card)}
              </div>
              <h2>{card.title}</h2>
            </div>
            <div className={styles.cardInfo}>
              <h1>
                {isLoadingCounts ? "..." : getCardCount(card)}
              </h1>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}