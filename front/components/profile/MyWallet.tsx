import Image from "next/image";
// import axios from "axios";
// import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./MyWallet.module.scss";
import walletLogo from "../../public/icons/walletLogo.png";
import addImg from "../../public/icons/addImg.svg";
import { createAccount, getBalance } from "../../pages/api/web3/Web3";
import createWallet from "../../pages/api/user/createWallet";
import NftModal from "../common/NftModal";
import loading from "../../public/icons/loading.svg";
import { getInfo } from "../../redux/slice/userSlice";

function MyWallet() {
  // const router = useRouter();
  const dispatch = useDispatch();
  const storeUser = useSelector((state: any) => state.user.userInfo);
  // const dummy = false;
  const walletAddress = storeUser.userWalletAddress;
  const [walletBalance, setWalletBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flag, setFlag] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const getWalletBalance = async () => {
    const balance = await getBalance(storeUser.userWalletAddress);
    setWalletBalance(balance);
  };
  useEffect(() => {
    if (storeUser.userWalletAddress) {
      getWalletBalance();
    }
  }, []);

  const handleCopyClipBoard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      // eslint-disable-next-line no-alert
      alert("지갑 주소가 복사 되었습니다.");
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert("복사에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (flag) {
      toggleModal();
      getWalletBalance();
    }
  }, [flag]);

  const createUserWallet = async () => {
    const Token = window.localStorage.getItem("AccessToken");
    const [userWalletAddress, userWalletKey] = await createAccount();
    console.log(userWalletAddress, userWalletKey);
    const getAxios = createWallet(userWalletAddress, userWalletKey);
    // router.push("/profile");
    getAxios
      .then((res) => {
        if (res.status === 200) {
          axios({
            url: `https://dog-hoogam.site:8000/api/user`,
            method: "get",
            headers: { Authorization: `Bearer ${Token}` }
          })
            .then((rres) => {
              if (rres.status === 200) {
                dispatch(getInfo(rres.data));
                // return res.data;
                console.log("토글");
                alert("지갑이 생성되었습니다.");
                // toggleModal();
                setFlag(true);
              }
              return [];
            })
            .catch((err) => {
              console.log(err);
            });
        }
        return [];
      })
      .catch((err) => {
        console.log(err);
      });
    // setFlag(true);
  };

  // useEffect(() => {
  //   if (flag) {
  //     // console.log(Token);
  //     console.log(flag);
  //   }
  // }, [flag]);

  return (
    <div className={`${styles.myWalletBox}`}>
      <NftModal isOpen={isModalOpen}>
        <Image src={loading} />
        <p className={`${styles.loadingFont} notoBold fs-20`}>
          지갑을 생성 중입니다.
        </p>
        <br />
        <p className={`${styles.loadingFont} notoMid fs-14`}>
          생성 시 지급되는 100 INK로
        </p>
        <p className={`${styles.loadingFont} notoMid fs-14`}>
          첫 피드를 작성해보세요!
        </p>
      </NftModal>
      <div className={`${styles.walletIcon}`}>
        <Image src={walletLogo} />
      </div>
      {storeUser.userWalletAddress ? (
        <div className={`${styles.walletTextBox}`}>
          <p
            className={`${styles.walletCoin}`}
          >{`보유코인 : ${walletBalance} INK`}</p>
          <div className={`${styles.walletAddressBox}`}>
            <p className={`${styles.walletAddress1}`}>지갑주소 : </p>
            <p className={`${styles.walletAddress2}`}>
              {storeUser.userWalletAddress}
              <button
                type="button"
                className={`${styles.copyBtn}`}
                onClick={() => handleCopyClipBoard(walletAddress)}
              >
                복사
              </button>
            </p>
          </div>
        </div>
      ) : (
        // <div className={`${styles.walletTextBox}`}>
        <div>
          <button
            type="button"
            className={`${styles.addWalletBtnBox}`}
            onClick={() => {
              createUserWallet();
              toggleModal();
            }}
          >
            <div className={`${styles.addWalletBtn}`}>
              <Image src={addImg} />
            </div>
            <p className={`${styles.addWalletBtnText}`}>
              지갑을 등록 해주세요!
            </p>
          </button>
        </div>
      )}
    </div>
  );
}

export default MyWallet;
