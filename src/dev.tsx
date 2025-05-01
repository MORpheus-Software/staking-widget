import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider, StakingWidget, StakingButton } from './index';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'widget' | 'button'>('widget');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  
  const handleSuccess = (action: string, txHash: string) => {
    setStatus('success');
    setMessage(`${action} transaction successful! Hash: ${txHash}`);
    console.log(`${action} successful! Transaction: ${txHash}`);
  };
  
  const handleError = (error: string) => {
    setStatus('error');
    setMessage(`Error: ${error}`);
    console.error('Error:', error);
  };
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('widget')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: activeTab === 'widget' ? '#2563eb' : '#e5e7eb',
            color: activeTab === 'widget' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer'
          }}
        >
          Full Widget
        </button>
        <button 
          onClick={() => setActiveTab('button')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: activeTab === 'button' ? '#2563eb' : '#e5e7eb',
            color: activeTab === 'button' ? 'white' : 'black',
            border: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          Button Only
        </button>
      </div>
      
      <WalletProvider networkType="testnet">
        {activeTab === 'widget' ? (
          <StakingWidget 
            networkType="testnet"
            defaultAmount="0.01"
            onSuccess={handleSuccess}
            onError={handleError}
          />
        ) : (
          <div>
            <h3>Simple Staking Button</h3>
            <p>Minimal implementation with just a button:</p>
            <StakingButton 
              networkType="testnet"
              amount="0.01"
              buttonText="Stake 0.01 MOR"
              buttonStyle={{ 
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
              onSuccess={(txHash) => handleSuccess('stake', txHash)}
              onError={handleError}
            />
          </div>
        )}
      </WalletProvider>
      
      {status !== 'idle' && (
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          borderRadius: '6px',
          backgroundColor: status === 'success' ? '#dcfce7' : '#fee2e2',
          color: status === 'success' ? '#166534' : '#b91c1c'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
        <h3>Development Notes</h3>
        <ul>
          <li>The widget is using the <strong>Arbitrum Sepolia testnet</strong> in this demo</li>
          <li>You need a wallet with testnet ETH and MOR tokens to test</li>
          <li>Check the console for more detailed logs</li>
        </ul>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 