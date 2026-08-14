import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { socket } from '../lib/socket';

export const DEFAULT_MEMBERSHIP_PRICE = 129;

function parsePrice(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : DEFAULT_MEMBERSHIP_PRICE;
}

const MembershipPriceContext = createContext<number>(DEFAULT_MEMBERSHIP_PRICE);

export function MembershipPriceProvider({ children }: { children: React.ReactNode }) {
  const [price, setPrice] = useState(DEFAULT_MEMBERSHIP_PRICE);

  const load = () => {
    api.get('/settings')
      .then((res) => {
        if (res.data?.settings?.membershipPrice != null) {
          setPrice(parsePrice(res.data.settings.membershipPrice));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    socket.on('settings_changed', load);
    return () => {
      socket.off('settings_changed', load);
    };
  }, []);

  return (
    <MembershipPriceContext.Provider value={price}>
      {children}
    </MembershipPriceContext.Provider>
  );
}

export function useMembershipPrice() {
  return useContext(MembershipPriceContext);
}
