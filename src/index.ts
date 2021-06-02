import axios from 'axios';
import config from './config';
import districtIds from './districts';
import { CalenderByDistrict } from './interfaces';

const {
  COWIN_BASE_URL,
  STATE,
  DISTRICTS,
  AGE,
  DOSE,
  VACCINE,
  TELEGRAM_TOKEN,
  CHAT_ID,
} = config;

const instance = axios.create({
  baseURL: COWIN_BASE_URL,
  headers: { 'Accept-Language': 'hi_IN' },
});

const telegram = axios.create({
  baseURL: `https://api.telegram.org/bot${TELEGRAM_TOKEN}/`,
});

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const fetch = async () => {
  const districts = districtIds.filter(
    districtInfo =>
      districtInfo.stateName === STATE &&
      (DISTRICTS ? DISTRICTS.includes(districtInfo.districtName) : true)
  );

  const resp = await Promise.all(
    districts.map(async district => {
      const _date = new Date();
      const date = `${_date.getDate()}-${_date.getMonth() +
        1}-${_date.getFullYear()}`;

      return (
        await instance.get(
          `v2/appointment/sessions/public/calendarByDistrict?district_id=${district.districtId}&date=${date}`
        )
      ).data as CalenderByDistrict;
    })
  );

  resp.map(calennderByDistrict => {
    calennderByDistrict.centers.map(center => {
      center.sessions.map(session => {
        if (
          (AGE ? session.min_age_limit <= AGE : true) &&
          session.available_capacity > 0 &&
          (VACCINE ? session.vaccine.toUpperCase() === VACCINE : true)
        ) {
          let msg;

          const dateArray = session.date.split('-');
          const date = `${MONTHS[parseInt(dateArray[1])]} ${dateArray[0]}`;

          if (DOSE === 1 && session.available_capacity_dose1 > 0) {
            msg = `Found ${session.vaccine} at ${center.name}, ${center.district_name} on ${date} for ${session.min_age_limit}+. \nAvailable Dose 1: ${session.available_capacity_dose1}`;
          } else if (DOSE === 2 && session.available_capacity_dose2 > 0) {
            msg = `Found ${session.vaccine} at ${center.name}, ${center.district_name} on ${date} for ${session.min_age_limit}+. \nAvailable Dose 2: ${session.available_capacity_dose2}`;
          } else if (
            session.available_capacity_dose1 > 0 ||
            session.available_capacity_dose2 > 0
          ) {
            msg = `Found ${session.vaccine} at ${center.name}, ${center.district_name} on ${date} for ${session.min_age_limit}+. \nAvailable Dose 1: ${session.available_capacity_dose1} \nAvailable Dose 2: ${session.available_capacity_dose2}`;
          }

          if (msg) {
            telegram
              .post('sendMessage', {
                chat_id: CHAT_ID,
                text: msg,
              })
              .catch(err => console.error('Telegram Error', err));
          }
        }
      });
    });
  });
};

setInterval(fetch, 8000);
