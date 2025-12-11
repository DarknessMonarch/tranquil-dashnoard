"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/AuthStore";
import styles from "@/app/styles/notfound.module.css";
import NotFoundImage from "@/public/assets/notfound.png";

import { MdKeyboardDoubleArrowRight as BackIcon } from "react-icons/md";

export default function NotFound() {
  const router = useRouter();
  const { isAuth } = useAuthStore();

  const goHome = () => {
    if (isAuth) {
      router.push(`/admin/dashboard`, { scroll: false });
    } else {
      router.back();
    }
  };

  return (
    <div className={styles.notFound}>
      <Image
        className={styles.notFoundImg}
        src={NotFoundImage}
        height={240}
        alt="Not found image"
        priority={true}
      />
      <div className={styles.buttonGroup}>
        {isAuth && (
          <button className={styles.notFoundBtn} onClick={goHome}>
            {isAuth ? (
              <>
                Dashboard{" "}
                <BackIcon className={styles.backIcon} aria-hidden="true" />
              </>
            ) : (
              <>
                Go Back{" "}
                <BackIcon className={styles.backIcon} aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
