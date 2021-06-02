import axios from 'axios';
import config from './config';
import districtIds from './districts';
interface VaccineFee {
  vaccine: string;
  fee: string;
}

interface Session {
  session_id: string;
  date: string;
  available_capacity: number;
  available_capacity_dose1: number;
  available_capacity_dose2: number;
  min_age_limit: number;
  vaccine: string;
  slots: string[];
}

interface Center {
  center_id: number;
  name: string;
  name_l: string;
  address: string;
  address_l: string;
  state_name: string;
  state_name_l: string;
  district_name: string;
  district_name_l: string;
  block_name: string;
  block_name_l: string;
  pincode: string;
  lat: number;
  long: number;
  from: string;
  to: string;
  fee_type: string;
  vaccine_fees: VaccineFee[];
  sessions: Session[];
}

interface CalenderByDistrict {
  centers: Center[];
}

const { BASE_URL, STATE, DISTRICTS } = config;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Accept-Language': 'hi_IN' },
});

export const fetch = async () => {
  const districts = districtIds.filter(
    districtInfo =>
      districtInfo.stateName === STATE &&
      DISTRICTS.includes(districtInfo.districtName)
  );

  const resp = await Promise.all(
    districts.map(async district => {
      const _date = new Date();
      const date = `${_date.getDate()}-${_date.getMonth()}-${_date.getFullYear()}`;

      return (
        await instance.get(
          `v2/appointment/sessions/public/calendarByDistrict?district_id=${district.districtId}&date=${date}`
        )
      ).data as CalenderByDistrict;
    })
  );

  console.log(resp);

  resp.map(calennderByDistrict => {
    calennderByDistrict.centers.map(center => {
      center.sessions.map(session => {
        if (session.min_age_limit === 18 && session.available_capacity > 0)
          console.log(
            'Available Slot at',
            center.name,
            center.district_name,
            session
          );
      });
    });
  });
};

try {
  fetch();
} catch (err) {
  console.error(err);
}
