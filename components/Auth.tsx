import { useState, useEffect, useRef } from 'react'
import SocialLogin from '@biconomy/web3-auth'
import { ChainId } from '@biconomy/core-types'
import { ethers } from 'ethers'
import SmartAccount from '@biconomy/smart-account'
import { css } from '@emotion/css'
import { initialize } from 'next/dist/server/lib/render-server'

export default function Home() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let configureLogin
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  async function login() {
    try {
      if (!sdkRef.current) {
        setLoading(true);
        const sdk = new SocialLogin();
        const localhostUrl = "http://localhost:3000"
        const localSignature = await sdk.whitelistUrl(
          localhostUrl 
        );
        const localhostUrl2 = "https://127.0.0.1:3000"
        const localSignature2 = await sdk.whitelistUrl(
          localhostUrl2 
        );

        await sdk.init({
          chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
          network: "testnet",
          whitelistUrls: {
            [localhostUrl]: localSignature,
            [localhostUrl2] : localSignature2,
           
          }
        });
        console.log("sdk initialized");
        sdkRef.current = sdk;
        setLoading(false);
      }

      console.log("sdk", sdkRef.current);

      if (sdkRef.current?.provider)
        return setupSmartAccount;

      sdkRef.current?.showWallet(); 
     enableInterval(true); 
    } catch (e: unknown) {
      console.error("unable to initialize SocialLogin", e);
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
      })
      await smartAccount.init()
      setSmartAccount(smartAccount)
      setLoading(false)
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
    
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  return (
    <div className={containerStyle}>
      <h1 className={headerStyle}>BICONOMY AUTH</h1>
      {
        !smartAccount && !loading && <button className={buttonStyle} onClick={login}>Login</button>
      }
      {
        loading && <p>Loading account details...</p>
      }
      {
        !!smartAccount && (
          <div className={detailsContainerStyle}>
            <h3>Smart account address:</h3>
            <p>{smartAccount.address}</p>
            <button className={buttonStyle} onClick={logout}>Logout</button>
          </div>
        )
      }
    </div>
  )
}

const detailsContainerStyle = css`
  margin-top: 10px;
`

const buttonStyle = css`
  padding: 14px;
  width: 300px;
  border: none;
  cursor: pointer;
  border-radius: 999px;
  outline: none;
  margin-top: 20px;
  transition: all .25s;
  &:hover {
    background-color: rgba(0, 0, 0, .2); 
  }
`

const headerStyle = css`
  font-size: 44px;
`

const containerStyle = css`
  width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 100px;
`
