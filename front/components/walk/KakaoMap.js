/* eslint-disable consistent-return */
/* eslint-disable prefer-template */
/* eslint-disable no-bitwise */
/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";

import gps from "../../public/icons/gps.svg";
import styles from "./KakaoMap.module.scss";
import Modal from "../common/Modal";
import {
  saveDistance,
  pushPaths,
  nowWalkingApi
} from "../../redux/slice/walkSlice";

let kakao;

if (typeof window !== "undefined") {
  kakao = window.kakao;
}

// const positions = [
//   {
//     title: "카카오",
//     latlng: { lat: 33.450705, lng: 126.570677 }
//   },
//   {
//     title: "생태연못",
//     latlng: { lat: 33.450936, lng: 126.569477 }
//   },
//   {
//     title: "텃밭",
//     latlng: { lat: 33.450879, lng: 126.56994 }
//   },
//   {
//     title: "근린공원",
//     latlng: { lat: 33.451393, lng: 126.570738 }
//   }
// ];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist * 1.609344;
};

const KakaoMap = () => {
  // console.log(process.env.NEXT_PUBLIC_KAKAO_KEY);
  const [positions, setPositions] = useState([]);
  const { isPaused, paths, personId, dogState, myDogs } = useSelector(
    (state) => state.walk
  );
  const timeout = useRef(null);
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({
    lat: 0,
    lng: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleOtherModal = () => setIsOtherModalOpen(!isOtherModalOpen);

  useEffect(() => {
    if (isModalOpen) {
      // axios.get();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isOtherModalOpen) {
      // axios.get();
    }
  }, [isOtherModalOpen]);

  const handleClick = ({ lat, lng }) => {
    const lastPos = paths[paths.length - 1];
    if (paths.length > 1 && lastPos.lat === lat && lastPos.lng) return;
    dispatch(pushPaths({ lat, lng }));
    if (paths?.length > 1) {
      // 최근 움직인 거리
      const dist = calculateDistance(
        paths[paths.length - 1].lat,
        paths[paths.length - 1].lng,
        lat,
        lng
      );
      dispatch(saveDistance(dist));
    }
  };

  const init = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude; // 위도
        const lng = position.coords.longitude; // 경도
        dispatch(pushPaths({ lat, lng }));
        setCenter({ lat, lng });
        handleClick({ lat, lng });
      });
    } else {
      alert("지도 정보를 허용해주세요!");
    }
  };

  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude; // 위도
        const lng = position.coords.longitude; // 경도
        map.setCenter(new kakao.maps.LatLng(lat, lng));
        setCenter({ lat, lng });
      });
    }
  };

  useEffect(() => {
    init();
  }, []);

  const walking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude; // 위도
          const lng = position.coords.longitude; // 경도
          console.log(lat, lng);
          nowWalkingApi({ lat, lng, personId })
            .then((res) => {
              console.log("성공", res);
              const newPositions = [];
              res.forEach((element) => {
                newPositions.push({
                  title: element.dogPk,
                  latlng: { lat: element.lat, lng: element.lng },
                  dogState: element.dogState
                });
              });
              setPositions(newPositions);
              dispatch(pushPaths({ lat, lng }));
              setCenter({ lat, lng });
              handleClick({ lat, lng });
            })
            .catch((err) => {
              console.log("실패");
              console.error(err);
            });
        },
        () => console.error,
        {
          enableHighAccuracy: true
        }
      );
    }
  };

  useEffect(() => {
    if (isSending) return;
    walking();
    setIsSending(true);
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    timeout.current = setTimeout(() => {
      setIsSending(false);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    }, 3000);
  }, [isSending]);

  useEffect(() => {
    if (isSending) return;
    if (!isPaused) {
      walking();
      setIsSending(true);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        setIsSending(false);
      }, 3000);
    } else if (isPaused) {
      setIsSending(true);
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    }
  }, [isSending, isPaused, walking]);

  return (
    <div className={styles.wrapper}>
      <Modal isOpen={isModalOpen} onClose={toggleModal}>
        {myDogs.map((dog) => (
          <div key={dog.pk}>
            <div>생일 : {dog.birthday}</div>
            <div>견종 : {dog.dogBreed}</div>
            <div>성격 : {dog.dogCharacter}</div>
            <div>
              <Image />
            </div>
            <div>이름 : {dog.dogName}</div>
          </div>
        ))}
      </Modal>

      <Map
        className={styles.map}
        center={center}
        level={1}
        onCreate={(map) => setMap(map)}
      >
        <Polyline
          path={paths}
          strokeWeight={3} // 선의 두께입니다
          strokeColor="#db4040" // 선의 색깔입니다
          strokeOpacity={1} // 선의 불투명도입니다 0에서 1 사이값이며 0에 가까울수록 투명합니다
          strokeStyle="solid" // 선의 스타일입니다
        />

        <div className={styles.map__marker}>
          <MapMarker
            position={center}
            onClick={toggleModal}
            image={{
              src:
                dogState === 0
                  ? "https://lab.ssafy.com/s07-final/S07P31C103/uploads/bd9a02e70f2fa3d9f84a7fd9ab8b7b0c/realGreen.png"
                  : "https://lab.ssafy.com/s07-final/S07P31C103/uploads/b8d28a189b358bfedc97693c18c51a3d/realRed.png", // 마커이미지의 주소입니다
              size: {
                width: 40,
                height: 40
              }, // 마커이미지의 크기입니다
              options: {
                offset: {
                  x: 20,
                  y: 40
                } // 마커이미지의 옵션입니다. 마커의 좌표와 일치시킬 이미지 안에서의 좌표를 설정합니다.
              }
            }}
          />
        </div>

        {positions.map((position, index) => (
          <div key={`${position.title}-${position.latlng},${index + 1}`}>
            <MapMarker
              onClick={toggleOtherModal}
              position={position.latlng} // 마커를 표시할 위치
              image={{
                src:
                  position.dogState === 0
                    ? "https://lab.ssafy.com/s07-final/S07P31C103/uploads/bd9a02e70f2fa3d9f84a7fd9ab8b7b0c/realGreen.png"
                    : "https://lab.ssafy.com/s07-final/S07P31C103/uploads/b8d28a189b358bfedc97693c18c51a3d/realRed.png", // 마커이미지의 주소입니다
                size: {
                  width: 40,
                  height: 40
                } // 마커이미지의 크기입니다
              }}
              title={position.title} // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
            />
            <Modal isOpen={isOtherModalOpen} onClose={toggleOtherModal}>
              <div>{position.title}</div>
            </Modal>
          </div>
        ))}
      </Map>

      <div
        className={styles.curLocation}
        onClick={fetchLocation}
        aria-hidden="true"
      >
        <Image src={gps} alt="gps" />
      </div>
    </div>
  );
};

export default KakaoMap;
