import './App.css';
import Header from './components/header/Header';
import MyStake from './components/MyStake/MyStake';
import StakeHistory from './components/StakeHistory/StakeHistory';
import {useState, useEffect} from 'react'
import Footer from './components/Footer/Footer';
import { ethers, utils, Contract } from 'ethers';
import BRTTokenAbi from './utils/web3/abi.json'
import { formatDate } from './utils/helpers';

const BRTTokenAddress = "0x169E82570feAc981780F3C48Ee9f05CED1328e1b";

function App() {

  // a flag for keeping track of whether or not a user is connected
  const [connected, setConnected] = useState(false);

  // connected user details
  const [userInfo, setUserInfo] = useState({
    matic_balance: 0,
    token_balance: 0,
    address: null
  });
  
  
  // the amount of token the user have staked
  const [stakeAmount, setStakeAmount] = useState(null)

  // the amount of reward the user has accumulate on his stake
  const [rewardAmount, setRewardAmount] = useState(null)

  // the value of token the user wants to stake
  const [stakeInput, setStakeInput] = useState("");

  // the value of token the user wants to withdraw
  const [withdrawInput, setWithdrawInput] = useState("");

  // the address of staker whose total stake user wants to see
  const [stakerAddressInput, setStakerAddressInput] = useState("");

  // all stake history data displayed on the history table
  const [stateHistory, setStakeHistory] = useState([]);

  // helper function for getting the matic and token balance, given an address
  const getAccountDetails = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const userMaticBal = await provider.getBalance(address);
      const BRTContractInstance = new Contract(BRTTokenAddress, BRTTokenAbi, provider);
      const userBRTBalance = await BRTContractInstance.balanceOf(address);

      // Get total staked
      const userStake = await BRTContractInstance.getStakeByAddress("0x845dA5011f60dF971025E48b831D61f0f7662674");
      
      // Calculate stake reward
      const daySpent = Date.now() - (userStake.time * 1000);
      const reward = ((userStake.stakeAmount * (daySpent / 86400000)) / 300);
      
      return {userBRTBalance, userMaticBal, userTotalStake: utils.formatEther(userStake.stakeAmount), userTotalReward: utils.formatEther(reward).substring(0, 6)};
    }catch(err) {
      console.log(err)
    }
  }

  // handler for when user switch from one account to another or completely disconnected
  const handleAccountChanged = async (accounts) => {
    if(!!accounts.length) {
      const networkId = await window.ethereum.request({method: "eth_chainId"})
      if(Number(networkId) !== 80001) return
      const accountDetails = await getAccountDetails(accounts[0])

      setUserInfo({
        matic_balance: accountDetails.userMaticBal,
        token_balance: accountDetails.userBRTBalance,
        address: accounts[0]
      })
      setStakeAmount(accountDetails.userTotalStake);
      setRewardAmount(accountDetails.userTotalReward);
      setConnected(true)
    }else {
      setConnected(false)
      setUserInfo({
        matic_balance: 0,
        token_balance: 0,
        address: null
      })
      setStakeAmount(0);
      setRewardAmount(0);            
    }
  }

  // handler for handling chain/network changed
  const handleChainChanged = async (chainid) => {
    if(Number(chainid) !== 80001) {
      setConnected(false)
      setUserInfo({
        matic_balance: 0,
        token_balance: 0,
        address: null
      })
      setStakeAmount(0);
      setRewardAmount(0);
      
      return alert("You are connected to the wrong network, please switch to polygon mumbai")
    }else {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if(!accounts.length) return
      const accountDetails = await getAccountDetails(accounts[0])
        setUserInfo({
          matic_balance: accountDetails.userMaticBal,
          token_balance: accountDetails.userBRTBalance,
          address: accounts[0]
        })
        setStakeAmount(accountDetails.userTotalStake);
        setRewardAmount(accountDetails.userTotalReward);
        setConnected(true)
      }
  }

  // an handler to eagerly connect user and fetch their data
  const eagerConnect = async () => {
    const networkId = await window.ethereum.request({method: "eth_chainId"})
    if(Number(networkId) !== 80001) return
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if(!accounts.length) return
    const accountDetails = await getAccountDetails(accounts[0])
      setUserInfo({
        matic_balance: accountDetails.userMaticBal,
        token_balance: accountDetails.userBRTBalance,
        address: accounts[0]
      })
      setStakeAmount(accountDetails.userTotalStake);
      setRewardAmount(accountDetails.userTotalReward);
      setConnected(true);
  }

  // a function for fetching necesary data from the contract and also listening for contract event when the page loads
  const init = async () => {
    const customProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL)
    const BRTContractInstance = new Contract(BRTTokenAddress, BRTTokenAbi, customProvider);
    const stakeHistory = await BRTContractInstance.queryFilter("stakeEvent");

    const history = [];
    
    stakeHistory.forEach(data => {
      history.unshift({
        amount: data.args[1],
        account: data.args[0],
        time: data.args[2].toString(),
        type: data.args[3],
      })
    })


    setStakeHistory(history);

    BRTContractInstance.on("stakeEvent", (account, amount, time, type) => {
      const newStake = {
        amount: amount,
        account: account,
        time: time.toString(),
        type: type,
      }

      setStakeHistory(prev => [newStake, ...prev]);
    })

  }

  useEffect(() => {

    init()
    if(!window.ethereum) return;
    // binding handlers to wallet events we care about
    window.ethereum.on("connect", eagerConnect)
    window.ethereum.on("accountsChanged", handleAccountChanged)
    window.ethereum.on('chainChanged', handleChainChanged);
  }, [])
  

  const connectWallet = async () => {
    if(!!window.ethereum || !!window.web3) {
      await window.ethereum.request({method: "eth_requestAccounts"})
    } else {
      alert("please use an etherum enabled browser");
    }
  }

  // onchange handler for handling both stake and unstake input value
  const onChangeInput = ({target}) => {
    switch (target.id) {
      case "stake":
        setStakeInput(target.value)
        break;

      case "unstake":
        setWithdrawInput(target.value);
        break;

      case "checkStake":
        setStakerAddressInput(target.value);
        break;
    
      default:
        break;
    }
  }

  // A function that handles staking
  const onClickStake = async (e) => {
    e.preventDefault()
    if(stakeInput < 0) return alert("you cannot stake less than 0 BRT")

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const BRTContractInstance = new Contract(BRTTokenAddress, BRTTokenAbi, signer);
    const weiValue = utils.parseEther(stakeInput);
    const stakeTx = await BRTContractInstance.stakeBRT(weiValue);

    await provider.getTransaction(stakeTx.hash)
    stakeTx.wait();

    // Get new balances
    await getAccountDetails(signer._address);
    
  }

  // A function that handles unstaking
  const onClickWithdraw = async (e) => {
    e.preventDefault()
    if(withdrawInput < 0) return alert("you cannot stake withdraw than 0 BRT");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const BRTContractInstance = new Contract(BRTTokenAddress, BRTTokenAbi, signer);
    const weiValue = utils.parseEther(stakeInput);
    const withdrawTx = await BRTContractInstance.withdraw(weiValue);

    await withdrawTx.wait();

    // Get new balances
    await getAccountDetails(signer._address);
  }

  // A function that handles displaying stake of any user
  const onClickCheckStake = async (e) => {
    e.preventDefault()

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const BRTContractInstance = new Contract(BRTTokenAddress, BRTTokenAbi, provider);

    // Get stake
    const userStake = await BRTContractInstance.getStakeByAddress(stakerAddressInput);
    alert(`
            Time of Stake: ${formatDate(userStake.time)} \n
            Address: ${utils.formatEther(userStake.staker)} \n 
            Total Stake: ${utils.formatEther(userStake.stakeAmount)} \n
            Validity: ${formatDate(userStake.valid)}
    `);
  }
  
  return (
    <div className="App">
      <Header 
        connectWallet = {connectWallet}
        connected={connected}
        userInfo = {userInfo}
      />
      <main className='main'>
        <MyStake
          stakeInput = {stakeInput}
          withdrawInput = {withdrawInput}
          stakerAddressInput = {stakerAddressInput}
          onChangeInput = {onChangeInput}
          onClickStake = {onClickStake}
          onClickWithdraw = {onClickWithdraw}
          onClickCheckStake = {onClickCheckStake}
          stakeAmount = {stakeAmount}
          rewardAmount = {rewardAmount}
          connected = {connected}

        />
        <StakeHistory
          stakeData = {stateHistory}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
