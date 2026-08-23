import { createContext, useContext } from 'react';

export const NavContext = createContext(null);

// What a place is CALLED, in one place. `back.label` is built from this, and a
// screen that ends somewhere rather than going back still needs the name — the
// Route's exit said "Back to Town" long after the town became Sunkist Lane.
export const PLACE_LABELS = {
  hub: 'Sunkist Lane',
  gym: 'the gym',
  rest: 'Home',
  route: 'the trails',
  world: 'the world map',
};

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavContext');
  return ctx;
}

export default NavContext;
