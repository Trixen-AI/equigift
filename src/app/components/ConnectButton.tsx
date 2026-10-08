import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Wallet } from 'lucide-react';
import { shortAddr } from '../lib/format';

export function ConnectButton({ label = 'Connect', className = '' }: { label?: string; className?: string }) {
  const { open } = useAppKit();
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount({ namespace: 'solana' });

  if (isConnected && address) {
    const who = embeddedWalletInfo?.user?.email || embeddedWalletInfo?.user?.username;
    return (
      <button className={`dash-account ${className}`} onClick={() => open({ view: 'Account' })}>
        <span className="dash-account-dot" />
        <span className="dash-account-addr">{who || shortAddr(address)}</span>
      </button>
    );
  }
  return (
    <button className={`btn btn-pri dash-connect ${className}`} onClick={() => open({ view: 'Connect', namespace: 'solana' })}>
      <Wallet size={16} />
      {label}
    </button>
  );
}
