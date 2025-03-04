/* eslint-disable jsx-a11y/label-has-associated-control */
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import styles from "./create.module.scss";
import back from "../../public/icons/back.svg";
import addimg from "../../public/icons/addImg2.png";
import sendFileToIPFS, { getBalance } from "../api/web3/Web3";
import addFeed from "../api/memory/addFeed";
import MyLocation from "../../components/memory/MyLocation";

import { setIsLoading } from "../../redux/slice/calendarSlice";

function Create() {
  const storeUser = useSelector((state: any) => state.user.userInfo);
  const storeLocation = useSelector(
    (state: any) => state.location.locationInfo
  );
  const [userKey, setUserKey] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [uploadimg, setUploadimg] = useState<any>(null);
  const [nftFeed, setNftFeed] = useState({
    content: ""
  });

  const [apiFeed, setApiFeed] = useState<any>({
    content: "",
    feedImg: "",
    lat: "",
    lng: "",
    transactionHash: ""
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const dispatch = useDispatch();
  const router = useRouter();
  const getWalletBalance = async () => {
    const balance = await getBalance(storeUser.userWalletAddress);
    setWalletBalance(balance);
  };

  useEffect(() => {
    if (storeUser.userWalletAddress) {
      getWalletBalance();
    }
  }, []);

  useEffect(() => {
    if (storeLocation) {
      setApiFeed({
        ...apiFeed,
        lat: storeLocation.center.lat,
        lng: storeLocation.center.lng
      });
    }
  }, [storeLocation]);

  useEffect(() => {
    const Token = window.localStorage.getItem("AccessToken");

    axios({
      url: "https://dog-hoogam.site/api/user-service/user/wallet",
      method: "get",
      headers: { Authorization: `Bearer ${Token}` }
    })
      .then((res) => {
        if (res.status === 200) {
          setUserKey(res.data.userPersonalKey);
          return res.data;
        }
        return [];
      })
      .catch((err) => {
        console.log(err);
      });
  });

  function handleImageUpload(e: any) {
    const fileArr = e.target.files;
    setImgFile(e.target.files[0]);
    const file = fileArr[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setUploadimg(reader.result);
    };
  }
  const makeNFT = async (e: any) => {
    if (walletBalance < 100) {
      alert("잉크가 모자랍니다. 산책으로 잉크를 모아주세요!");
    } else if (nftFeed.content === "") {
      alert("내용을 입력해주세요");
    } else if (
      window.confirm(
        "100INK를 사용하여 피드를 작성하시겠습니까? \n 발행 시 최대 1분 정도 소요 될 수 있습니다."
      )
    ) {
      try {
        dispatch(setIsLoading(true));
        router.push("/memory");
        const feedNft = await sendFileToIPFS(
          e,
          imgFile,
          nftFeed,
          100,
          storeUser.userWalletAddress,
          userKey
        );
        setApiFeed({
          ...apiFeed,
          feedImg: feedNft[0],
          transactionHash: feedNft[1]
        });
        const res = await addFeed(
          {
            ...apiFeed,
            feedImg: feedNft[0],
            transactionHash: feedNft[1]
          },
          imgFile
        );
        if (res.status === 200) {
          dispatch(setIsLoading(false));
          alert("피드가 등록되었습니다.");
        }
      } catch (error) {
        console.error(error);
        alert("피드가 등록이 실패했습니다.");
        dispatch(setIsLoading(false));
      }
    }
  };
  return (
    <div className={`${styles.wrapper}`}>
      <div>
        <div className={`${styles.memoryNav} flex justify-space-between`}>
          <button
            className={`${styles.backbutton}`}
            onClick={() => router.back()}
            type="button"
          >
            <Image src={back} alt="#" />
          </button>
          <button
            className={`${styles.createbutton} notoMid fs-16`}
            type="button"
            onClick={(e) => {
              makeNFT(e);
            }}
          >
            발행하기
          </button>
        </div>
        <div className={`${styles.inputForm} flex justify-space-around`}>
          <input
            className={`${styles.image}`}
            onChange={(e) => handleImageUpload(e)}
            id="uploadimg"
            type="file"
            accept="image/gif, image/jpeg, image/png"
            hidden
          />
          <label className={`${styles.image}`} htmlFor="uploadimg">
            {uploadimg ? (
              <img className={`${styles.preview}`} src={uploadimg} alt="#" />
            ) : (
              <div
                className={`${styles.noimg} flex justify-center align-center`}
              >
                <Image src={addimg} alt="#" />
              </div>
            )}
          </label>
          <textarea
            className={`${styles.text} fs-16 notoMid`}
            placeholder="문구 입력..."
            onChange={(e) => {
              setNftFeed({ ...nftFeed, content: e.target.value });
              setApiFeed({ ...apiFeed, content: e.target.value });
            }}
          />
        </div>
      </div>
      <div className={`${styles.place} flex justify-start align-center`}>
        <h1 className={`${styles.space} fs-16 notoMid`}>
          추억 남길 위치를 지정해주세요!
        </h1>
      </div>
      <MyLocation />
    </div>
  );
}

export default Create;
