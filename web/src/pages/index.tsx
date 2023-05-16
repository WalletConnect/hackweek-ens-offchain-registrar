import { Button, Card, Input } from '@ensdomains/thorin'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useEffect, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'

import { Helper } from '@/components/Helper'
import { WorkerRequest } from '@/types'

import useDebounce from '../hooks/useDebounce'
import { useFetch } from '../hooks/useFetch'

export default function App() {
  const { address } = useAccount()
  const [name, setName] = useState<string | undefined>(undefined)
  const [description, setDescription] = useState<string | undefined>(undefined)
  const debouncedName = useDebounce(name, 500)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  const regex = new RegExp('^[a-z0-9-]+$')
  const enabled = !!debouncedName && regex.test(debouncedName)

  const { data, isLoading, signMessage, variables } = useSignMessage()

  const requestBody: WorkerRequest = {
    name: `${debouncedName}.offchaindemo.eth`,
    records: {
      addresses: {
        60: address,
      },
      text: {
        description: description,
      },
    },
    signature: {
      hash: data,
      message: variables?.message,
    },
    isTemporary: true,
  }

  const { data: gatewayData, error: gatewayError } = useFetch(
    data && '/api/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!isMounted) return null

  return (
    <Card style={{ width: '100%', alignItems: 'center', gap: '1.5rem' }}>
      <ConnectButton showBalance={false} />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          signMessage({
            message: `Register ${debouncedName}.offchaindemo.eth`,
          })
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: '1rem',
        }}
      >
        <Input
          type="text"
          label="Name"
          suffix=".offchaindemo.eth"
          placeholder="ethny"
          required
          disabled={!!data || !address}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="text"
          label="Description"
          placeholder="My cool event"
          disabled={!!data || !address}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button type="submit" disabled={!enabled || !!data} loading={isLoading}>
          Register
        </Button>
      </form>

      {gatewayError ? (
        <Helper type="error">
          {gatewayError.message === 'Conflict'
            ? 'Somebody already registered that name'
            : 'Something went wrong'}
        </Helper>
      ) : gatewayData ? (
        <Helper>
          <p>
            Visit the{' '}
            <a
              href={`https://app.ens.domains/${debouncedName}.offchaindemo.eth`}
              target="_blank"
              style={{
                fontWeight: '500',
                color: '#3888ff',
                textDecoration: 'underline',
              }}
            >
              ENS Manager
            </a>{' '}
            to see your name. It will stop working in 1 hour.
          </p>
        </Helper>
      ) : !!debouncedName && !enabled ? (
        <Helper type="error">Name must be lowercase alphanumeric</Helper>
      ) : null}
    </Card>
  )
}
