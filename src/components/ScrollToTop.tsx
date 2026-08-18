import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const filter = params.get("filter");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, view, filter]);

  return null;
};

export default ScrollToTop;
