import styles from "@/app/styles/loadingLogo.module.css";
import { IoSparkles as SparklesIcon } from "react-icons/io5";

export default function Loading() {
  return (
    <div className={styles.loadingComponent}>
     <div className={styles.loader}>
        <SparklesIcon className={styles.loaderIcon} />
      </div>
    </div>
  );
}