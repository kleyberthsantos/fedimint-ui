import React, { useEffect, useState } from 'react';
import { Flex, Box, Heading, Skeleton } from '@chakra-ui/react';
import {
  ClientConfig,
  SignedApiAnnouncement,
  StatusResponse,
} from '@fedimint/types';
import { useAdminContext } from '../hooks';
import { GatewaysCard } from '../components/dashboard/gateways/GatewaysCard';
import { GuardiansCard } from '../components/dashboard/guardians/GuardiansCard';
import { FederationInfoCard } from '../components/dashboard/admin/FederationInfoCard';
import { BitcoinNodeCard } from '../components/dashboard/admin/BitcoinNodeCard';
import { BalanceCard } from '../components/dashboard/admin/BalanceCard';
import { InviteCode } from '../components/dashboard/admin/InviteCode';
import { FederationTabsCard } from '../components/dashboard/tabs/FederationTabsCard';
import { BftInfo } from '../components/BftInfo';
import { DangerZone } from '../components/dashboard/danger/DangerZone';

export const FederationAdmin: React.FC = () => {
  const { api } = useAdminContext();
  const [status, setStatus] = useState<StatusResponse>();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [config, setConfig] = useState<ClientConfig>();
  const [signedApiAnnouncements, setSignedApiAnnouncements] = useState<
    Record<string, SignedApiAnnouncement>
  >({});
  const [ourPeer, setOurPeer] = useState<{ id: number; name: string }>();
  const [latestSession, setLatestSession] = useState<number>();

  // Extracting our peer ID and name from intersection of config and status
  useEffect(() => {
    if (config && status?.federation) {
      const peerIds = Object.keys(status.federation.status_by_peer).map((id) =>
        parseInt(id, 10)
      );
      const configPeerIds = Object.keys(config.global.api_endpoints).map((id) =>
        parseInt(id, 10)
      );
      // Finding our peer ID as the one present in config but not in status
      const ourPeerId = configPeerIds.find((id) => !peerIds.includes(id));
      if (ourPeerId !== undefined) {
        setOurPeer({
          id: ourPeerId,
          name: config.global.api_endpoints[ourPeerId].name,
        });
      }
      const latestSession = status?.federation?.session_count;
      setLatestSession(latestSession);
    }
  }, [config, status]);

  useEffect(() => {
    api.inviteCode().then(setInviteCode).catch(console.error);
    api.config().then(setConfig).catch(console.error);
    const fetchStatus = () => {
      api.status().then(setStatus).catch(console.error);
    };
    api.apiAnnouncements().then(setSignedApiAnnouncements).catch(console.error);
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <Flex gap='32px' flexDirection='row'>
      <Flex gap={6} flexDirection='column' w='100%'>
        <Heading size='xs' mt='12px'>
          {config ? (
            config.global.meta.federation_name
          ) : (
            <Skeleton height='32px' width='180px' />
          )}
        </Heading>
        <Flex
          flexDirection={{ base: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ base: 'stretch', md: 'center' }}
          gap={{ base: 4, md: 6 }}
        >
          <Box width={{ base: '100%', md: 'auto' }}>
            <InviteCode inviteCode={inviteCode} />
          </Box>
          {config && (
            <Box width={{ base: '100%', md: 'auto' }}>
              <BftInfo
                numPeers={Object.keys(config.global.api_endpoints).length}
              />
            </Box>
          )}
        </Flex>
        <Flex
          gap={6}
          alignItems='flex-start'
          flexDir={{ base: 'column', sm: 'column', md: 'row' }}
        >
          <Flex w='100%' direction='column' gap={5}>
            <FederationInfoCard
              status={status}
              config={config}
              latestSession={latestSession}
            />
            <BitcoinNodeCard modulesConfigs={config?.modules} />
          </Flex>
          <BalanceCard />
        </Flex>
        <GuardiansCard
          status={status}
          config={config}
          signedApiAnnouncements={signedApiAnnouncements}
        />
        <GatewaysCard config={config} />
        {ourPeer ? (
          <FederationTabsCard config={config} ourPeer={ourPeer} />
        ) : null}
        <DangerZone
          inviteCode={inviteCode}
          ourPeer={ourPeer}
          latestSession={latestSession}
          signedApiAnnouncements={signedApiAnnouncements}
        />
      </Flex>
    </Flex>
  );
};
