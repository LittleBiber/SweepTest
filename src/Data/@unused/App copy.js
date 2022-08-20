import Web3 from 'web3'
import { useState, useEffect, useRef } from 'react'

const USDC_ADDR = '0x655Ccb0de971BBe68bDACE95C9E6606488004a8D'
const USDT_ADDR = '0x0B815ADc75a5Cb97C38366436F6FF9cefC6e0be9'
const contractAddr = '0x5354AaF4a49314435C1F9B92917200DbEa4cdc0f'
// const defaultSweeper = '0xBE46F1cccf5a7D6515d3f701080763Cfa4403cA3'
// const token = '0x18237b06e91C73563722c965358384b97B322CA9'
// const UserWallet = '0x7473B24E47C12578398f1f7703cFC2066764fE4B'

const depositAddr = '0xBB6d80517CA08b0b13c910276632C8ce2b05E31C'

export default function App() {
    //! 지갑 주소 저장하는 상태값
    const [walletAddress, setWalletAddress] = useState(null)
    const [userWalletAddr, setUserWalletAddr] = useState('')
    const [depositAddr, setDepositAddr] = useState('')
    const [controllerAddr, setControllerAddr] = useState('')

    const Controller = require('./Data/Sweep/Controller.json')
    const DefaultSweeper = require('./Data/Sweep/DefaultSweeper.json')
    const USDC = require('./Data/USDCoin/USDCoin.json')
    const USDT = require('./Data/Tether/TetherToken.json')

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
            setWalletAddress(accounts[0])
            web3.eth.defaultAccount = accounts[0]
        } else {
            alert('Install MetaMask first!')
        }
    }

    useEffect(() => {
        connectWallet()
    }, [])

    const deployController = () => {
        const newContract = new web3.eth.Contract(Controller.abi)

        const payload = {
            data: Controller.bytecode,
        }

        const deployParams = {
            from: walletAddress,
            // gas: web3.utils.toHex(1000000),
            // gasPrice: web3.utils.toHex(web3.utils.toWei('90', 'gwei')),
        }

        newContract
            .deploy(payload)
            .send(deployParams, (err, transactionHash) => {
                if (err) console.log('ERROR!!!')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                setControllerAddr(newContractInstance.options.address)
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    const deploy_defaultSweeper = () => {
        const newContract = new web3.eth.Contract(DefaultSweeper.abi)

        const payload = {
            data: DefaultSweeper.bytecode,
            arguments: [controllerAddr],
        }

        const deployParams = {
            from: walletAddress,
            // gas: web3.utils.toHex(1000000),
            // gasPrice: web3.utils.toHex(web3.utils.toWei('90', 'gwei')),
        }

        newContract
            .deploy(payload)
            .send(deployParams, (err, transactionHash) => {
                if (err) console.log('ERROR!!!')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    const deploy_token = () => {
        const Token = require('./Data/Sweep/Token.json')

        const newContract = new web3.eth.Contract(Token.abi)

        const payload = {
            data: Token.bytecode,
        }

        const deployParams = {
            from: walletAddress,
            // gas: web3.utils.toHex(1000000),
            // gasPrice: web3.utils.toHex(web3.utils.toWei('90', 'gwei')),
        }

        newContract
            .deploy(payload)
            .send(deployParams, (err, transactionHash) => {
                if (err) console.log('ERROR!!!')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    const deploay_userWallet = () => {
        const UserWallet = require('./Data/Sweep/UserWallet.json')

        const newContract = new web3.eth.Contract(UserWallet.abi)

        const payload = {
            data: UserWallet.bytecode,
            arguments: [controllerAddr],
        }

        const deployParams = {
            from: walletAddress,
            // gas: web3.utils.toHex(1000000),
            // gasPrice: web3.utils.toHex(web3.utils.toWei('90', 'gwei')),
        }

        newContract
            .deploy(payload)
            .send(deployParams, (err, transactionHash) => {
                if (err) console.log('ERROR!!!')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    const createDepositAccont = () => {
        // console.log(Controller.abi)
        const newContract = new web3.eth.Contract(Controller.abi)

        //! This contract object doesn't have address set yet, please set an address first.
        // = 컨트랙트 주소가 없어서 발생
        newContract.options.address = contractAddr
        // '0x7a9dd64128f67ECd7203B6798e0e6b12478f9255'

        newContract.methods
            .makeWallet()
            .send({ from: walletAddress, to: userWalletAddr })
            .then((res) => {
                console.log(res)
                setDepositAddr(res.events.LogNewWallet.returnValues.receiver)
            })
            .catch((e) => console.log(e))
    }

    const onClickSweep = async (id) => {
        // console.log(DefaultSweeper.abi)
        const newContract = new web3.eth.Contract(DefaultSweeper.abi)

        //! Sweep 을 입금계좌에서 실행해야 하는 것 같다...? 인터레스팅.
        newContract.options.address = depositAddr

        const token = id === 0 ? USDT_ADDR : USDC_ADDR
        const amount =
            id === 0 ? await getUSDTBalance() : await getUSDCBalance()

        newContract.methods
            .sweep(token, amount)
            .send({ from: walletAddress })
            .then((res) => {
                console.log(res)
            })
            .catch((e) => console.log(e))
    }

    const getUSDCBalance = async () => {
        const newContract = new web3.eth.Contract(USDC.abi)
        newContract.options.address = USDC_ADDR

        const value =
            (await newContract.methods
                .balanceOf(depositAddr)
                .call({ from: walletAddress })) || 0

        console.log(value)

        return await value
    }

    const getUSDTBalance = async () => {
        const newContract = new web3.eth.Contract(USDT.abi)
        newContract.options.address = USDC_ADDR

        const value =
            (await newContract.methods
                .balanceOf(depositAddr)
                .call({ from: walletAddress })) || 0
        console.log(value)

        return await value
    }

    return (
        <div className="App">
            <h1>이미 보유한 컨트랙트 입력</h1>
            <div>
                <span>Controller 컨트랙트</span>
                <input
                    placeholder="controller addr"
                    value={controllerAddr}
                    onChange={(e) => setControllerAddr(e.target.value)}
                />
            </div>
            <div>
                <span>입금 계좌 컨트랙트</span>
                <input
                    placeholder="deposit addr"
                    value={depositAddr}
                    onChange={(e) => setDepositAddr(e.target.value)}
                />
            </div>

            <h1>실행전 배포해야 하는 컨트랙트</h1>
            <ul>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>Controller</span>
                        <button onClick={deployController}>배포</button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>DefaultSweeper</span>
                        <input
                            placeholder="controller addr"
                            value={controllerAddr}
                            onChange={(e) => setControllerAddr(e.target.value)}
                        />
                        <button onClick={deploy_defaultSweeper}>배포</button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>Token</span>
                        <button onClick={deploy_token}>배포</button>
                    </div>
                </li>
                <li style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span>UserWallet</span>
                        <input
                            placeholder="controller addr"
                            value={controllerAddr}
                            onChange={(e) => setControllerAddr(e.target.value)}
                        />
                        <button onClick={deploay_userWallet}>배포</button>
                    </div>
                </li>
            </ul>

            <h1>메타마스크 연결 테스트</h1>
            <div>
                <button onClick={connectWallet}>메타마스크 지갑 연결</button>
                {walletAddress ? (
                    <span>현재 지갑주소 {walletAddress}</span>
                ) : (
                    ''
                )}
            </div>

            <div>
                <h1>입금 지갑 생성</h1>
                <input
                    placeholder="주소를 입력해 주세요"
                    value={userWalletAddr}
                    onChange={(e) => setUserWalletAddr(e.target.value)}
                />

                <div>{depositAddr}</div>

                <button onClick={createDepositAccont}>생성</button>
            </div>

            <div>
                <h1>Sweep 실행하기</h1>

                <button onClick={() => onClickSweep(0)}>USDT</button>
                <button onClick={() => onClickSweep(1)}>USDC</button>
            </div>
            <div>
                <h1>잔고 받기 테스트</h1>
                <button onClick={getUSDCBalance}>USDC</button>
                <button onClick={getUSDTBalance}>USDT</button>
            </div>
        </div>
    )
}

// const testMakeWallet = () => {
//     const Controller = require('./Data/Sweep/UserWallet.json')
//     console.log(Controller.abi)
//     const newContract = new web3.eth.Contract(Controller.abi)
//     //! This contract object doesn't have address set yet, please set an address first.
//     // = 컨트랙트의 대상주소가 없어서 나오는 오류
//     newContract.options.address =
//         '0x95a0034FD26c9C418F55b9C48E4eD7f4E70DAde9' // 현재 생성한 지갑 계정
//     // '0x7a9dd64128f67ECd7203B6798e0e6b12478f9255'

//     newContract.methods
//         .sweep('0x0B815ADc75a5Cb97C38366436F6FF9cefC6e0be9', 99999900) // 토큰의 주소, 양(Decimal-RAW)
//         .send({ from: '0x43228029dA20B8706DF623E186970D9DF6DfeEe5' }) // 발신자를 데이터로 명시해야 함 (Delegate Call이라 그런지는 다시 확인해야 함.)
//         // .on('confirmation', (conf) => {
//         //     console.log(conf)
//         // })
//         .then((res) => {
//             console.log(res)
//         })
//         .catch((e) => console.log(e))
// }

// // //! 컨트랙트 배포
// const deployContract = () => {
//     // 컨트랙트 생성
//     // const Controller = require('./Data/Sweep/Controller.json')
//     const newContract = new web3.eth.Contract(Controller.abi)

//     // 컨트랙트의 페이로드, EVM을 위한 바이트코드와 컨스트럭터에 들어갈 변수가 저장된다.
//     const payload = {
//         // data: TokenJSON.bytecode,
//     }

//     // 컨트랙트의 파라미터, 컨트랙트를 전송하는 대상을 지정한다.
//     // 가스비는 지정할 수 있지만, 메타마스크에서 알아서 계산해주는 쪽이 더 잘 되는 편
//     const deployParams = {
//         from: walletAddress,
//         // gas: web3.utils.toHex(1000000),
//         // gasPrice: web3.utils.toHex(web3.utils.toWei('90', 'gwei')),
//     }

//     newContract
//         .deploy(payload)
//         .send(deployParams, (err, transactionHash) => {
//             if (err) console.log('ERROR!!!')
//             else console.log('TransactionHash: ', transactionHash)
//         })
//         .on('confirmation', () => {})
//         .then((newContractInstance) => {
//             console.log(
//                 'Deployed Contract Address : ',
//                 newContractInstance.options.address
//             )
//         })
// }
