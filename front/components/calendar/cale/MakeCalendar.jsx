/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
// eslint-disable-next-line import/no-unresolved
import { useSelector, useDispatch } from "react-redux";
import styles1 from "./DayCheck.module.scss";
import styles2 from "./MakeCalendar.module.scss";

import { transString } from "./CalcDate";

import { setSelectDay } from "../../../redux/slice/calendarSlice";

const returnIdx = (order, year, month, day) => {
  if (order === "PREV") {
    if (month === 0) {
      return transString(year - 1, 12, day);
    }
    return transString(year, month, day);
  }
  if (order === "NEXT") {
    if (month === 11) {
      return transString(year + 1, 1, day);
    }
    return transString(year, month + 2, day);
  }

  return transString(year, month + 1, day);
};

const MakeCalendar = ({ year, month, firstDay, lastDate }) => {
  const dispatch = useDispatch();
  function daySelect(e) {
    const newDay = Number(e.currentTarget.children[0].innerText);
    dispatch(setSelectDay({ year, month: month + 1, day: newDay }));
  }

  const result = [];
  const dayEvent = useSelector((state) => state.calendar.memos);
  const selectDay = useSelector((state) => state.calendar.selectDay);
  const walkRecord = useSelector((state) => state.calendar.records);
  const makeDay = (week) => {
    const result2 = [];
    if (week === 1) {
      const prevLastDate = parseInt(new Date(year, month, 0).getDate(), 10);
      for (let i = 1; i <= 7; i += 1) {
        if (i <= firstDay) {
          const now = prevLastDate - firstDay + i;
          const idx = returnIdx("PREV", year, month, now);
          result2.push(
            <td key={idx} className={`${styles1.diff}`}>
              <button type="button" className={`${styles1.daybutton}`}>
                {now}
              </button>
            </td>
          );
        } else {
          const now = i - firstDay;
          const idx = returnIdx("", year, month, now);
          let dayTag;

          if (
            selectDay &&
            selectDay.year === year &&
            selectDay.month === month + 1 &&
            selectDay.day === now
          ) {
            dayTag = (
              <td
                className={`${styles2.selectDay} ${styles1.caltd}`}
                onClick={(e) => daySelect(e)}
                key={idx}
              >
                <button className={`${styles2.dayButton}`} type="button">
                  {now}
                </button>
                <div className="flex justify-center">
                  {dayEvent[now]?.length > 0 ? (
                    <div className={`${styles2.isMemo}`} />
                  ) : null}
                  {walkRecord[now]?.length > 0 ? (
                    <div className={`${styles2.isWalk}`} />
                  ) : null}
                </div>
              </td>
            );
          } else {
            dayTag = (
              <td
                className={`${styles2.day} ${styles1.caltd}`}
                onClick={(e) => daySelect(e)}
                key={idx}
              >
                <button className={`${styles2.dayButton}`} type="button">
                  {now}
                </button>
                <div className="flex justify-center">
                  {dayEvent &&
                  dayEvent.length > 0 &&
                  dayEvent[now].length > 0 ? (
                    <div className={`${styles2.isMemo}`} />
                  ) : null}
                  {walkRecord &&
                  walkRecord.length > 0 &&
                  walkRecord[now].length > 0 ? (
                    <div className={`${styles2.isWalk}`} />
                  ) : null}
                </div>
              </td>
            );
          }
          result2.push(dayTag);
        }
      }
    } else {
      const startDate = (week - 1) * 7;
      for (let i = startDate; i <= week * 7 - 1; i += 1) {
        // 현재 달 날짜
        if (i - firstDay < lastDate) {
          const now = i - firstDay + 1;
          const idx = returnIdx("", year, month, now);

          let dayTag;
          if (
            selectDay &&
            selectDay.year === year &&
            selectDay.month === month + 1 &&
            selectDay.day === now
          ) {
            dayTag = (
              <td
                className={`${styles2.selectDay} ${styles1.caltd}`}
                onClick={(e) => daySelect(e)}
                key={idx}
              >
                <button className={`${styles2.dayButton}`} type="button">
                  {now}
                </button>
                <div className="flex justify-center">
                  {dayEvent[now]?.length > 0 ? (
                    <div className={`${styles2.isMemo}`} />
                  ) : null}
                  {walkRecord[now]?.length > 0 ? (
                    <div className={`${styles2.isWalk}`} />
                  ) : null}
                </div>
              </td>
            );
          } else {
            dayTag = (
              <td
                className={`${styles2.day} ${styles1.caltd}`}
                onClick={(e) => daySelect(e)}
                key={idx}
              >
                <button className={`${styles2.dayButton}`} type="button">
                  {now}
                </button>
                <div className="flex justify-center">
                  {dayEvent &&
                  dayEvent.length > 0 &&
                  dayEvent[now].length > 0 ? (
                    <div className={`${styles2.isMemo}`} />
                  ) : null}
                  {walkRecord &&
                  walkRecord.length > 0 &&
                  walkRecord[now].length > 0 ? (
                    <div className={`${styles2.isWalk}`} />
                  ) : null}
                </div>
              </td>
            );
          }
          result2.push(dayTag);
        }
        // 다음 달 날짜
        else {
          const now = i - lastDate - firstDay + 1;
          const idx = returnIdx("NEXT", year, month, now);

          result2.push(
            <td key={idx} className={`${styles1.diff}`}>
              <button type="button" className={`${styles1.daybutton}`}>
                {now}
              </button>
            </td>
          );
        }
      }
    }
    return result2;
  };

  // 주 계산
  const week = Math.ceil((firstDay + lastDate) / 7);
  for (let i = 1; i <= week; i += 1) {
    result.push(<tr key={week + i}>{makeDay(i)}</tr>);
  }
  return result;
};

export default MakeCalendar;
