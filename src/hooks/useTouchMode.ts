import { useEffect } from "react";

type UseTouchModeParams = {
  setTouchEnabled: (value: boolean) => void;
  setCompactHud: (value: boolean) => void;
};

export function useTouchMode({ setTouchEnabled, setCompactHud }: UseTouchModeParams) {
  useEffect(() => {
    const updateTouchMode = () => {
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const hasAnyCoarsePointer = window.matchMedia("(any-pointer: coarse)").matches;
      const hasAnyFinePointer = window.matchMedia("(any-pointer: fine)").matches;
      const hasAnyHover = window.matchMedia("(any-hover: hover)").matches;
      const ua = navigator.userAgent || "";
      const uaDataMobile = (
        navigator as Navigator & { userAgentData?: { mobile?: boolean } }
      ).userAgentData?.mobile;
      const isMobileUa =
        !!uaDataMobile ||
        /Android|iPhone|iPad|iPod|Mobile|Windows Phone|webOS|BlackBerry/i.test(ua);
      const isSmallTouchScreen = window.matchMedia("(max-width: 900px)").matches;
      const isCompactHudScreen = window.matchMedia(
        "(max-width: 1200px), (max-height: 860px)"
      ).matches;
      const isDesktopHybridTouch =
        !isMobileUa &&
        hasAnyFinePointer &&
        hasAnyHover &&
        window.matchMedia("(min-width: 901px)").matches;
      const shouldUseTouchUi =
        hasTouch &&
        !isDesktopHybridTouch &&
        (isMobileUa || isSmallTouchScreen || hasAnyCoarsePointer);

      setTouchEnabled(shouldUseTouchUi);
      setCompactHud(shouldUseTouchUi && isCompactHudScreen);
    };

    updateTouchMode();
    window.addEventListener("resize", updateTouchMode);
    return () => {
      window.removeEventListener("resize", updateTouchMode);
    };
  }, [setCompactHud, setTouchEnabled]);
}
