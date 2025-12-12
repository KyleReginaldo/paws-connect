'use client';
import FundraisingDonate from '@/components/FundraisingDonate';
import { Fundraising } from '@/config/models/fundraising';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
const page = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fundraisings, setFundraisings] = useState<Fundraising[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  const fundraising = async () => {
    const response = await axios.get('/api/v1/fundraising');
    if (response.status === 200) {
      console.log(response.data);
      setFundraisings(response.data.data);
    } else {
      setErrorMsg('Failed to load fundraising data');
    }
  };
  useEffect(() => {
    fundraising();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'text-blue-600';
      case 'COMPLETE':
        return 'text-green-600';
      case 'CANCELLED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const toggleDescription = (id: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-[100wh] md:bg-orange-50 pb-10">
      <h1 className="text-3xl font-bold text-center pt-10">Fundraising</h1>
      <div className="flex flex-wrap justify-center md:mt-10 md:gap-6">
        {errorMsg ? (
          <p className="text-red-600 text-center">{errorMsg}</p>
        ) : (
          fundraisings.map((fundraising) => (
            <div
              key={fundraising.id}
              className={`h-fit bg-white rounded-lg shadow-md p-6 w-full md:w-80 border-b-[1px] md:border-none ${getStatusColor(fundraising.status)}`}
            >
              <div className="relative w-full h-[200px] mb-4 rounded-lg overflow-hidden">
                <Image
                  src={fundraising.images[0]}
                  alt={fundraising.title}
                  fill
                  className="object-cover"
                />
              </div>
              <p>{fundraising.status.toLocaleLowerCase()}</p>
              <h2 className="text-xl font-semibold mb-4">{fundraising.title}</h2>
              <div className="mb-4">
                <p
                  className={`text-gray-600 ${
                    expandedDescriptions[fundraising.id] ? '' : 'line-clamp-3'
                  }`}
                >
                  {fundraising.description}
                </p>
                {fundraising.description && fundraising.description.length > 150 && (
                  <button
                    onClick={() => toggleDescription(fundraising.id)}
                    className="text-blue-600 text-sm hover:underline mt-1"
                  >
                    {expandedDescriptions[fundraising.id] ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              <p className="text-gray-800 font-medium">
                Target Amount: ₱{fundraising.target_amount.toLocaleString()}
              </p>
              <p className="text-gray-800 font-medium">
                Raised Amount: ₱{fundraising.raised_amount.toLocaleString()}
              </p>

              {/* E-Wallets */}
              {fundraising.e_wallets && fundraising.e_wallets.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">E-Wallets:</h3>
                  {fundraising.e_wallets.map((wallet, index) => (
                    <div key={index} className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">{wallet.label}:</span> {wallet.account_number}
                    </div>
                  ))}
                </div>
              )}

              {/* Bank Accounts */}
              {fundraising.bank_accounts && fundraising.bank_accounts.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Bank Accounts:</h3>
                  {fundraising.bank_accounts.map((bank, index) => (
                    <div key={index} className="text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">{bank.bank_name}</span>
                      </div>
                      <div>{bank.account_name}</div>
                      <div>{bank.account_number}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Links */}
              {fundraising.links && fundraising.links.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Links:</h3>
                  {fundraising.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block mb-1"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              )}

              {fundraising.status === 'ONGOING' && (
                <div className="mt-4">
                  <FundraisingDonate fundraisingId={fundraising.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default page;
