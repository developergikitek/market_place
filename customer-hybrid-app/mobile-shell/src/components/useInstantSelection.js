import { useRef, useState } from 'react';

/**
 * Instant highlight for tab bars and section cards. The real selection lives in App.js and only
 * updates after the whole shell re-renders for the navigation, which is visibly slow (hundreds
 * of ms in debug builds). This keeps a local "just picked" id, set on touch-down, so only the bar
 * itself re-renders and the icon swaps on the next frame. Once the parent's selection changes it
 * takes over; a cancelled touch (finger dragged off) drops the pick.
 *
 * Returns [shownId, pressProps]; spread pressProps(id, onPress) onto a Pressable.
 */
export function useInstantSelection(selected) {
  const [pick, setPick] = useState(null); // { id, from: selection when it was picked }
  const pressedRef = useRef(false);

  const shown = pick && pick.from === selected ? pick.id : selected;

  const pressProps = (id, onPress) => ({
    onPressIn: () => {
      pressedRef.current = false;
      setPick({ id, from: selected });
    },
    // Pressable calls onPressOut just before onPress: check afterwards whether the press landed
    onPressOut: () => {
      setTimeout(() => {
        if (!pressedRef.current) setPick(null);
      }, 0);
    },
    onPress: () => {
      pressedRef.current = true;
      onPress();
    },
  });

  return [shown, pressProps];
}
