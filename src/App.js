import Web3 from 'web3'
import { useState, useEffect } from 'react'

//! 컨트랙트
const USDC = require('./Data/USDCoin/USDCoin.json')
const USDT = require('./Data/Tether/TetherToken.json')
const CONTROLLER = require('./Data/Sweep/Controller.json')
const USERWALLET = require('./Data/Sweep/UserWallet.json')

//! 주소
const USDC_ADDR = '0x655Ccb0de971BBe68bDACE95C9E6606488004a8D'
const USDT_ADDR = '0x0B815ADc75a5Cb97C38366436F6FF9cefC6e0be9'

export default function App() {
    //! 지갑 주소 저장하는 상태값
    const [connectedAddresss, setConnectedAddress] = useState('')
    const [controller, setController] = useState('')
    const [userDepositAddress, setUserDepositAddress] = useState('')
    const [newAuthorizedAddress, setNewAuthorizedAddress] = useState('')
    const [newDestination, setNewDestination] = useState('')
    const [newOwner, setNewOwner] = useState('')

    //! Web3
    const web3 = new Web3(window.ethereum)

    //! 지갑 연결
    const connectWallet = async () => {
        // Check if MetaMask is installed on user's browser
        if (window.ethereum) {
            // Try to get MetaMask account
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            })
            setConnectedAddress(accounts[0])
            web3.eth.defaultAccount = accounts[0]
        } else {
            alert('Install MetaMask first!')
        }
    }

    // Controller 배포
    const deployController = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)

        newContract
            .deploy({ data: CONTROLLER.bytecode })
            .send({ from: connectedAddresss }, (err, transactionHash) => {
                if (err) console.log('ERROR')
                else console.log('TransactionHash: ', transactionHash)
            })
            .on('confirmation', () => {})
            .then((newContractInstance) => {
                setController(newContractInstance.options.address)
                console.log(
                    'Deployed Contract Address : ',
                    newContractInstance.options.address
                )
            })
    }

    // Code Owner 변경: 모든권한 가짐
    const onChangeOwner = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)
        newContract.options.address = controller

        newContract.methods
            .changeOwner(newOwner)
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log('Owner 변경 성공', res)
            })
            .catch((e) => console.log(e))
    }

    // AuthorizedCaller 변경: 지갑 생성, Sweep, Halt가능
    const onChangeAuthorizedCaller = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)
        newContract.options.address = controller

        newContract.methods
            .changeAuthorizedCaller(newAuthorizedAddress)
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log('AuthorizedCaller 변경 성공', res)
            })
            .catch((e) => console.log(e))
    }

    // Destination 변경: 국고계좌 변경
    const onChangeDestination = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)
        newContract.options.address = controller

        newContract.methods
            .changeDestination(newDestination)
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log('Destination 변경 성공', res)
            })
            .catch((e) => console.log(e))
    }

    // 지갑 생성
    const onMakeWallet = () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)

        //! This contract object doesn't have address set yet, please set an address first.
        // = 컨트랙트 주소가 없어서 발생 / 트랜잭션을 전송할 주소
        newContract.options.address = controller

        newContract.methods
            .makeWallet()
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log(res)
                setUserDepositAddress(
                    res.events.LogNewWallet.returnValues.receiver
                )
            })
            .catch((e) => console.log(e))
    }

    // 잔고 체크
    const getUSDCBalance = async () => {
        const newContract = new web3.eth.Contract(USDC.abi)
        newContract.options.address = USDC_ADDR

        const value = await newContract.methods
            .balanceOf(userDepositAddress)
            .call()

        console.log(value)

        return await value
    }

    const getUSDTBalance = async () => {
        const newContract = new web3.eth.Contract(USDT.abi)
        newContract.options.address = USDT_ADDR

        const value = await newContract.methods
            .balanceOf(userDepositAddress)
            .call()

        console.log(value)

        return await value
    }

    // Sweep 함수 실행
    const onClickSweep = async (id) => {
        const newContract = new web3.eth.Contract(USERWALLET.abi)

        // Sweep 을 입금계좌에서 실행 > DefaultSweeper에서 Delegate call 실행됨.
        // A > B로 Call을 하는데 A에 데이터를 저장하고 B의 코드만 가져다가 사용함.
        // import 비슷하게 생각하면 될것같다
        newContract.options.address = userDepositAddress

        const token = id === 0 ? USDT_ADDR : USDC_ADDR
        const amount =
            id === 0 ? await getUSDTBalance() : await getUSDCBalance()

        newContract.methods
            .sweep(token, amount)
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log(res)
            })
            .catch((e) => console.log(e))
    }

    // Sweep 정지
    const onClickHalt = async () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)
        newContract.options.address = controller

        newContract.methods
            .halt()
            .send({ from: connectedAddresss })
            .then((res) => {
                console.log(res)
            })
            .catch((e) => console.log(e))
    }

    // Sweep 가능하게 변경
    const onClickStart = async () => {
        const newContract = new web3.eth.Contract(CONTROLLER.abi)
        newContract.options.address = controller

        newContract.methods
            .start()
            .send({ from: connectedAddresss })
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
                    {!connectedAddresss ? '연결' : '새로고침'}
                </button>
                {connectedAddresss ? (
                    <span>사용자 주소 : {connectedAddresss}</span>
                ) : (
                    ''
                )}
            </div>

            <h1>컨트랙트 주소</h1>

            <input
                placeholder="controller addr"
                value={controller}
                onChange={(e) => setController(e.target.value)}
            />

            <div>
                <h1>컨트랙트 배포</h1>
                <button
                    onClick={() => deployController(CONTROLLER, setController)}
                >
                    배포
                </button>
            </div>

            <div>
                <h1>입금계좌 생성</h1>
                <button onClick={() => onMakeWallet()}>생성</button>
                <div>{userDepositAddress}</div>
            </div>

            <div>
                <h1>Owner 변경</h1>
                <input onChange={(e) => setNewOwner(e.target.value)} />
                <button onClick={onChangeOwner}>변경</button>
            </div>

            <div>
                <h1>AuthorizedCaller 변경</h1>
                <input
                    onChange={(e) => setNewAuthorizedAddress(e.target.value)}
                />
                <button onClick={onChangeAuthorizedCaller}>변경</button>
            </div>

            <div>
                <h1>Destination 변경</h1>
                <input onChange={(e) => setNewDestination(e.target.value)} />
                <button onClick={onChangeDestination}>변경</button>
            </div>

            <div>
                <h1>Sweep</h1>
                <div>전체 보유량 Sweep</div>
                <input
                    value={userDepositAddress}
                    onChange={(e) => setUserDepositAddress(e.target.value)}
                />
                <button onClick={() => onClickSweep(0)}>USDT</button>
                <button onClick={() => onClickSweep(1)}>USDC</button>
            </div>

            <div>
                <h1>서비스 중단/시작</h1>

                <button onClick={onClickHalt}>Halt</button>
                <button onClick={onClickStart}>Start</button>
            </div>
        </div>
    )
}
