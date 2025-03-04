/* eslint-disable jsx-a11y/img-redundant-alt */
/* eslint-disable no-lonely-if */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable consistent-return */
/* eslint-disable prefer-template */
/* eslint-disable no-bitwise */
/* eslint-disable no-shadow */
/* eslint-disable prettier/prettier */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";

import gps from "../../public/icons/gps.svg";
import styles from "./KakaoMap.module.scss";
import Modal from "../common/Modal";
import {
  saveDistance,
  pushPaths,
  nowWalkingApi,
  getOtherDogs,
  getFeeds
} from "../../redux/slice/walkSlice";
import WalkSlider from "./WalkSlider";
import pathSvg from "../../public/icons/path.svg";
import walkingSvg from "../../public/icons/walking.svg";
import feedSvg from "../../public/icons/feed.svg";

let kakao;

if (typeof window !== "undefined") {
  kakao = window.kakao;
}

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
  const showDogs = useRef();
  const showFeeds = useRef();
  const showPaths = useRef();
  const [selectedShowDogs, setSelectedShowDogs] = useState(true);
  const [selectedShowFeeds, setSelectedShowFeeds] = useState(true);
  const [selectedShowPaths, setSelectedShowPaths] = useState(true);
  const [otherPositions, setOtherPositions] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const { isPaused, paths, personId, selectedDogs } = useSelector(
    (state) => state.walk
  );
  const timeout = useRef(null);
  const dispatch = useDispatch();
  const [map, setMap] = useState(null);
  const [level, setLevel] = useState(1);
  const [center, setCenter] = useState({
    lat: 0,
    lng: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mySelectedDogs, setMySelectedDogs] = useState([]);
  const [other, setOther] = useState({});
  const [pks, setPks] = useState([]);
  const [feed, setFeed] = useState(null);

  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleOtherModal = () => setIsOtherModalOpen(!isOtherModalOpen);
  const toggleFeedModal = () => setIsFeedModalOpen(!isFeedModalOpen);

  useEffect(() => {
    if (!selectedShowDogs) {
      if (showDogs.current) {
        showDogs.current.classList.add(`${styles.opacity}`);
      }
    } else {
      if (showDogs.current) {
        showDogs.current.classList.remove(`${styles.opacity}`);
      }
    }

    if (!selectedShowFeeds) {
      if (showFeeds.current) {
        showFeeds.current.classList.add(`${styles.opacity}`);
      }
    } else {
      if (showFeeds.current) {
        showFeeds.current.classList.remove(`${styles.opacity}`);
      }
    }

    if (!selectedShowPaths) {
      if (showPaths.current) {
        showPaths.current.classList.add(`${styles.opacity}`);
      }
    } else {
      if (showPaths.current) {
        showPaths.current.classList.remove(`${styles.opacity}`);
      }
    }
  }, [selectedShowDogs, selectedShowFeeds, selectedShowPaths]);

  useEffect(() => {
    getFeeds()
      .then((res) => {
        setFeeds(res);
      })
      .catch(() => console.error);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const pks = [];
      selectedDogs.forEach((dog) => {
        pks.push(dog.id);
      });
      getOtherDogs(pks)
        .then((res) => {
          setMySelectedDogs(res);
        })
        .catch(() => console.error);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isOtherModalOpen) {
      if (pks && pks.length > 0) {
        getOtherDogs(pks)
          .then((res) => {
            setOther(res);
          })
          .catch(() => console.error);
      }
    }
  }, [isOtherModalOpen, pks]);

  const handleClick = ({ lat, lng }) => {
    if (paths?.length > 1) {
      const dist = calculateDistance(
        paths[paths.length - 1].lat,
        paths[paths.length - 1].lng,
        lat,
        lng
      );
      if (dist > 0.05) {
        return;
      }
      dispatch(saveDistance(dist));
    }

    const lastPos = paths[paths.length - 1];
    if (paths.length > 1 && lastPos.lat === lat && lastPos.lng) return;
    let xDiff = 0;
    let yDiff = 0;
    if (lastPos) {
      xDiff = lat - lastPos.lat;
      yDiff = lng - lastPos.lng;
    }
    const tmp = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    if (tmp > 0.00004) {
      dispatch(pushPaths({ lat, lng }));
    }
  };

  const init = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        dispatch(pushPaths({ lat, lng }));
        setCenter({ lat, lng });
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

  const walking = useCallback(() => {
    if (isSending) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude; // 위도
          const lng = position.coords.longitude; // 경도
          nowWalkingApi({ lat, lng, personId })
            .then((res) => {
              const tmp = res.filter((item) => item.dogPk !== null);
              setOtherPositions([...tmp]);
              setCenter({ lat, lng });
              handleClick({ lat, lng });
            })
            .catch(() => console.error);
        },
        () => console.error,
        {
          enableHighAccuracy: true
        }
      );
    }
  }, [isSending]);

  useEffect(() => {
    if (!isPaused) {
      walking(); // api 호출
      setIsSending(true); // API 플래그
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        setIsSending(false);
      }, 3000);
    } else if (isPaused) {
      setIsSending(true);
    }
  }, [isPaused, walking]);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.buttons} flex column`}>
        <div
          ref={showDogs}
          className={styles.buttons__dog}
          onClick={() => setSelectedShowDogs((prev) => !prev)}
        >
          <Image src={walkingSvg} alt="walking" />
        </div>
        <div
          ref={showFeeds}
          className={styles.buttons__feed}
          onClick={() => setSelectedShowFeeds((prev) => !prev)}
        >
          <Image src={feedSvg} alt="feed" />
        </div>
        <div
          ref={showPaths}
          className={styles.buttons__path}
          onClick={() => setSelectedShowPaths((prev) => !prev)}
        >
          <Image src={pathSvg} alt="path" />
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={toggleModal}>
        {mySelectedDogs.length > 0 && <WalkSlider dogs={mySelectedDogs} />}
      </Modal>

      <Modal isOpen={isOtherModalOpen} onClose={toggleOtherModal}>
        {other.length > 0 && <WalkSlider dogs={other} />}
      </Modal>

      <Modal isOpen={isFeedModalOpen} onClose={toggleFeedModal}>
        {feed && (
          <div className={`${styles.feedModal} flex column`}>
            <img
              className={styles.feedModal__img}
              src={feed.feedImg}
              alt="feed image"
            />
            <div className={`${styles.feedModal__content} notoMid`}>
              {feed.content}
            </div>
            <div className={`${styles.feedModal__date} notoMid`}>
              {feed.createDate}
            </div>
          </div>
        )}
      </Modal>

      <Map
        className={styles.map}
        center={center}
        level={level}
        onCreate={(map) => setMap(map)}
        onZoomChanged={(map) => setLevel(map.getLevel())}
      >
        {selectedShowPaths && (
          <Polyline
            path={paths}
            strokeWeight={5}
            strokeColor="#db4040"
            strokeOpacity={1}
            strokeStyle="solid"
          />
        )}

        <div className={styles.map__marker}>
          <MapMarker
            position={center}
            onClick={toggleModal}
            image={{
              src: "https://lab.ssafy.com/s07-final/S07P31C103/uploads/cb6c81bf7666ee151f433a868703a3da/record.png",
              size: {
                width: 24,
                height: 24
              },
              options: {
                offset: {
                  x: 12,
                  y: 16
                }
              }
            }}
          />
        </div>

        {selectedShowDogs &&
          otherPositions.map((position, index) => (
            <div key={`${position.lat}-${position.lng},${index * 1}`}>
              <MapMarker
                onClick={() => {
                  toggleOtherModal();
                  if (position.dogPk) {
                    setPks(position.dogPk);
                  }
                }}
                position={{ lat: position.lat, lng: position.lng }}
                image={{
                  src:
                    position.dogState === 0
                      ? "https://lab.ssafy.com/s07-final/S07P31C103/uploads/bd9a02e70f2fa3d9f84a7fd9ab8b7b0c/realGreen.png"
                      : "https://lab.ssafy.com/s07-final/S07P31C103/uploads/b8d28a189b358bfedc97693c18c51a3d/realRed.png",
                  size: {
                    width: 40,
                    height: 40
                  }
                }}
              />
            </div>
          ))}

        {selectedShowFeeds &&
          feeds.length > 0 &&
          feeds.map((feed) => (
            <div className={styles.feedMarker} key={feed.pk}>
              <MapMarker
                position={{
                  lat: feed.lat,
                  lng: feed.lng
                }}
                image={{
                  src: "https://lab.ssafy.com/s07-final/S07P31C103/uploads/b4c5e7861b0c4ecf37e46427200d1663/star.png",
                  size: {
                    width: 34,
                    height: 34
                  }
                }}
                onClick={() => {
                  toggleFeedModal();
                  setFeed(feed);
                }}
                // eslint-disable-next-line react/jsx-boolean-value
                clickable={true}
              />
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
