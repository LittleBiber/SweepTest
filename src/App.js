import Web3 from 'web3'
import { useState, useEffect, useRef } from 'react'

//! 컨트랙트
const USDC = require('./Data/USDCoin/USDCoin.json')
const USDT = require('./Data/Tether/TetherToken.json')
const CONTROLLER = require('./Data/Sweep/Controller.json')
const DEFAULTSWEEPER = require('./Data/Sweep/DefaultSweeper.json')
const TOKEN = require('./Data/Sweep/Token.json')
const USERWALLET = require('./Data/Sweep/UserWallet.json')

//! 주소
const USDC_ADDR = '0x655Ccb0de971BBe68bDACE95C9E6606488004a8D'
const USDT_ADDR = '0x0B815ADc75a5Cb97C38366436F6FF9cefC6e0be9'

export default function App() {
    //! 지갑 주소 저장하는 상태값
    const [deployWallet, setDeployWallet] = useState('')

    const [controller, setController] = useState('')
    const [deposit, setDeposit] = useState('')
    const [inputWallet, setInputWallet] = useState('')
    const [defaultSweeper, setDefaultSweeper] = useState('')
    const [token, setToken] = useState('')
    const [userWallet, setUserWallet] = useState('')

    //! Web3
    const web3 = new Web3(window.ethereum)

    //! 지갑 연결
    const connectWallet = async () => {
        // Check if MetaMask is installed on user's browser
        if (window.ethereum) {
            // Try to get MetaMask account
            const accounts = await window.ethereum.request({
                method: 'eth_accounts',
            })
            setDeployWallet(accounts[0])
            web3.eth.defaultAccount = accounts[0]
        } else {
            alert('Install MetaMask first!')
        }
    }

    const deployContract = (jsonFile, setState, controller) => {
        const newContract = new web3.eth.Contract(jsonFile.abi)

        const payload = controller
            ? { data: jsonFile.bytecode, arguments: [controller] }
            : {
                  data: jsonFile.bytecode,
              }

        const deployParams = { from: deployWallet }

        newContract
            .deploy(payload)
            .send(deployParams, (err, transactionHash) => {
                if (err) console.log('ERROR!!!')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                setState(newContractInstance.options.address)
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    const onMakeWallet = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)

        //! This contract object doesn't have address set yet, please set an address first.
        // = 컨트랙트 주소가 없어서 발생
        newContract.options.address = controller
        // '0x7a9dd64128f67ECd7203B6798e0e6b12478f9255'

        newContract.methods
            .makeWallet()
            .send({ from: deployWallet, to: inputWallet })
            .then((res) => {
                console.log(res)
                setDeposit([
                    ...deposit,
                    res.events.LogNewWallet.returnValues.receiver,
                ])
            })
            .catch((e) => console.log(e))
    }

    const getUSDCBalance = async () => {
        const newContract = new web3.eth.Contract(USDC.abi)
        newContract.options.address = USDC_ADDR

        const value = await newContract.methods.balanceOf(deposit).call()

        console.log(value)

        return await value
    }

    const getUSDTBalance = async () => {
        const newContract = new web3.eth.Contract(USDT.abi)
        newContract.options.address = USDT_ADDR

        const value = await newContract.methods.balanceOf(deposit).call()

        console.log(value)

        return await value
    }

    const onClickSweep = async (id) => {
        const newContract = new web3.eth.Contract(DEFAULTSWEEPER.abi)

        // Sweep 을 입금계좌에서 실행해야 하는 것 같다
        newContract.options.address = deposit

        const token = id === 0 ? USDT_ADDR : USDC_ADDR
        const amount =
            id === 0 ? await getUSDTBalance() : await getUSDCBalance()

        newContract.methods
            .sweep(token, amount)
            .send({ from: deployWallet })
            .then((res) => {
                console.log(res)
            })
            .catch((e) => console.log(e))
    }

    useEffect(() => {
        connectWallet()
    }, [])

    return (
        <div className="App">
            <h1>메타마스크 연결</h1>
            <div>
                <button onClick={connectWallet}>
                    {!deployWallet ? '연결' : '새로고침'}
                </button>
                {deployWallet ? (
                    <span>컨트랙트 배포 주소 : {deployWallet}</span>
                ) : (
                    ''
                )}
            </div>

            <h1>컨트랙트 주소 (이미 배포하였으면 입력해 사용 가능)</h1>
            <div>
                <span>Controller 컨트랙트</span>
                <input
                    placeholder="controller addr"
                    value={controller}
                    onChange={(e) => setController(e.target.value)}
                />
            </div>
            <div>
                <span>defaultSweeper 컨트랙트</span>
                <input
                    placeholder="defaultSweeper addr"
                    value={defaultSweeper}
                    onChange={(e) => setDefaultSweeper(e.target.value)}
                />
            </div>
            <div>
                <span>token 컨트랙트</span>
                <input
                    placeholder="token addr"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                />
            </div>
            <div>
                <span>userWallet 컨트랙트 </span>
                <input
                    placeholder="userWallet addr"
                    value={userWallet}
                    onChange={(e) => setUserWallet(e.target.value)}
                />
            </div>
            <div>
                <span>생성된 입금 계좌</span>
                <input
                    placeholder="deposit addr"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                />
            </div>

            <h1>배포 버튼</h1>
            <ul>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>Controller</span>
                        <button
                            onClick={() =>
                                deployContract(CONTROLLER, setController)
                            }
                        >
                            배포
                        </button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>DefaultSweeper</span>
                        <span>Controller 주소 필수</span>
                        <button
                            disabled={!controller}
                            onClick={() =>
                                deployContract(
                                    DEFAULTSWEEPER,
                                    setDefaultSweeper,
                                    controller
                                )
                            }
                        >
                            배포
                        </button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>Token (필수인것 같기는 한데, 명확히는 X)</span>
                        <button onClick={() => deployContract(TOKEN, setToken)}>
                            배포
                        </button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>UserWallet</span>
                        <span>Controller 주소? 필요(명확하지 않음)</span>
                        <button
                            disabled={!controller}
                            onClick={() =>
                                deployContract(
                                    USERWALLET,
                                    setUserWallet,
                                    controller
                                )
                            }
                        >
                            배포
                        </button>
                    </div>
                </li>
            </ul>

            <div>
                <h1>입금계좌 생성</h1>
                <div>생성 대상 주소 입력</div>
                <input
                    placeholder="주소를 입력해 주세요"
                    value={inputWallet}
                    onChange={(e) => setInputWallet(e.target.value)}
                />

                <button onClick={() => onMakeWallet()}>생성</button>
            </div>

            <div>
                <h1>Sweep 실행</h1>
                <div>보유량 획득 후 전체 보유량을 Sweep</div>
                <button onClick={() => onClickSweep(0)}>USDT</button>
                <button onClick={() => onClickSweep(1)}>USDC</button>
            </div>
            <div>
                <h1>잔고 확인</h1>
                <button onClick={() => {}}>USDC</button>
                <button onClick={() => {}}>USDT</button>
            </div>
        </div>
    )
}
