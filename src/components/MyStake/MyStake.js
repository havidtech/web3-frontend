import clsx from 'clsx'
import React from 'react'
import Card from './Card/Card'
import Styles from './MyStake.module.css'

const MyStake = ({
  withdrawInput, 
  stakeInput, 
  stakerAddressInput,
  onChangeInput, 
  onClickStake, 
  onClickWithdraw,
  onClickCheckStake,
  rewardAmount,
  stakeAmount,
  connected
}) => {
  return (
    <div className={Styles.root}>
        <h2 className={Styles.heading}>My stake</h2>

        <div className={Styles.stake_body}>
          <div className={Styles.card_container}>
            <Card 
              cardKey="Total Staked"
              cardValue = {stakeAmount}
            />
            <Card 
              cardKey="Total Reward"
              cardValue = {rewardAmount}
            />
          </div>
          <form onSubmit={onClickStake} className={Styles.form} >
            <input 
              type = "number" 
              placeholder="Amount to stake" 
              className={Styles.input}
              value = {stakeInput}
              onChange = {onChangeInput}
              id = "stake"
            />
            <button type='submit' className={clsx({[Styles.stake_btn]: true, [Styles.btn_diabled]: !connected})}
              disabled = {!connected}
            >Stake</button>
          </form>

          <form onSubmit = {onClickWithdraw} className={Styles.form} >
            <input 
              type = "number" 
              placeholder="Amount to unstake" 
              className={Styles.input}
              value = {withdrawInput}
              onChange = {onChangeInput}
              id = "unstake"
            />
            <button type="submit"
            className={clsx({[Styles.unstake_btn]: true, [Styles.btn_diabled]: !connected})}
            disabled = {!connected}
            >Unstake</button>
          </form>

          <form onSubmit = {onClickCheckStake} className={Styles.form} >
            <input 
              placeholder="Address of staker" 
              className={Styles.input}
              value = {stakerAddressInput}
              onChange = {onChangeInput}
              id = "checkStake"
            />
            <button type="submit"
            className={Styles.checkStake_btn}
            >View</button>
          </form>
        </div>
    </div>
  )
}

export default MyStake