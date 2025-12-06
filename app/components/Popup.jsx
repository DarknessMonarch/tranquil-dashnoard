"use client";

import styles from "@/app/styles/popup.module.css";
import { MdCancel as ExitIcon } from "react-icons/md";

export default function PopupComponent({
  BorderRadiusTopLeft = 0,
  BorderRadiusTopRight = 0,
  BorderRadiusBottomRight = 0,
  BorderRadiusBottomLeft = 0,
  IsOpen,
  OnClose,
  Content,
  Width,
  Height,
  Top,
  Right,
  Left,
  Blur,
  Bottom,
  Zindex,
}) {
  if (!IsOpen) {
    return null;
  }

  return (
    <div
      className={styles.popupContainer}
      style={{ zIndex: Zindex, backdropFilter: `blur(${Blur}px)` }}
    >
      <div
        className={styles.popup}
        style={{
          width: `${Width}px`,
          height: `${Height}px`,
          top: `${Top}px`,
          right: `${Right}px`,
          bottom: `${Bottom}px`,
          left: `${Left}px`,
          borderRadius: `${BorderRadiusTopLeft}px ${BorderRadiusTopRight}px ${BorderRadiusBottomRight}px ${BorderRadiusBottomLeft}px`,
        }}
      >
        <div className={styles.popupHeader}>
          <div className={styles.Notchbar}></div>
          <div className={styles.popupExit}>
            <ExitIcon
              className={styles.popupIcon}
              alt="Exit icon"
              aria-label="Exit icon"
              aria="exit icon"
              onClick={OnClose}
            />
          </div>
        </div>
        {Content}
      </div>
    </div>
  );
}
