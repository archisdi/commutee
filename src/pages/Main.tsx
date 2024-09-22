import moment from 'moment';

import { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonSelect, IonSelectOption, IonCard, IonCardContent, IonText, IonRow, IonCol, IonGrid,
  IonRefresher, IonRefresherContent, useIonLoading
} from '@ionic/react';

interface TrainSchedule {
  train_id: string;
  ka_name: string;
  route_name: string;
  dest: string;
  time_est: string;
  color: string;
  dest_time: string;
  time_est_minute: number;
}

interface Station {
  sta_id: string;
  sta_name: string;
  group_wil: number;
  fg_enable: number;
}

const JWT_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiMDYzNWIyOGMzYzg3YTY3ZTRjYWE4YTI0MjYxZGYwYzIxNjYzODA4NWM2NWU4ZjhiYzQ4OGNlM2JiZThmYWNmODU4YzY0YmI0MjgyM2EwOTUiLCJpYXQiOjE3MjI2MTc1MTQsIm5iZiI6MTcyMjYxNzUxNCwiZXhwIjoxNzU0MTUzNTE0LCJzdWIiOiI1Iiwic2NvcGVzIjpbXX0.Jz_sedcMtaZJ4dj0eWVc4_pr_wUQ3s1-UgpopFGhEmJt_iGzj6BdnOEEhcDDdIz-gydQL5ek0S_36v5h6P_X3OQyII3JmHp1SEDJMwrcy4FCY63-jGnhPBb4sprqUFruDRFSEIs1cNQ-3rv3qRDzJtGYc_bAkl2MfgZj85bvt2DDwBWPraZuCCkwz2fJvox-6qz6P7iK9YdQq8AjJfuNdl7t_1hMHixmtDG0KooVnfBV7PoChxvcWvs8FOmtYRdqD7RSEIoOXym2kcwqK-rmbWf9VuPQCN5gjLPimL4t2TbifBg5RWNIAAuHLcYzea48i3okbhkqGGlYTk3iVMU6Hf_Jruns1WJr3A961bd4rny62lNXyGPgNLRJJKedCs5lmtUTr4gZRec4Pz_MqDzlEYC3QzRAOZv0Ergp8-W1Vrv5gYyYNr-YQNdZ01mc7JH72N2dpU9G00K5kYxlcXDNVh8520-R-MrxYbmiFGVlNF2BzEH8qq6Ko9m0jT0NiKEOjetwegrbNdNq_oN4KmHvw2sHkGWY06rUeciYJMhBF1JZuRjj3JTwBUBVXcYZMFtwUAoikVByzKuaZZeTo1AtCiSjejSHNdpLxyKk_SFUzog5MOkUN1ktAhFnBFoz6SlWAJBJIS-lHYsdFLSug2YNiaNllkOUsDbYkiDtmPc9XWc";
const BASE_URL = "https://api-partner.krl.co.id";
const DELTA_MINUTES = 30;

const Main: React.FC = () => {
  const now = moment();
  const [showLoading, dismissLoading] = useIonLoading();
  const [station, setStation] = useState<Station[]>([]);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [trainSchedule, setTrainSchedule] = useState<TrainSchedule[]>([]);

  const getStation = async () => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }

    const { data } = await fetch(
      `${BASE_URL}/krlweb/v1/krl-station`,
      { headers: defaultHeaders }
    )
      .then(res => res.json());

    const stations = data.filter((station: Station) => station.group_wil === 0 && station.fg_enable === 1);
    setStation(stations);
  }

  const getStationSchedule = async (station?: Station) => {
    if (!station) return;
    showLoading({ showBackdrop: false });
    try {
      const timefrom = moment().format('HH:mm');
      const timeto = moment().add(DELTA_MINUTES, 'minutes').format('HH:mm');

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }

      const { data } = await fetch(
        `${BASE_URL}/krlweb/v1/schedule?stationid=${station.sta_id}&timefrom=${timefrom}&timeto=${timeto}`,
        { headers: defaultHeaders }
      )
        .then(res => res.json())
        .catch(() => ({ data: [] }));

      const TrainSchedule = data
        .filter((train: TrainSchedule) => !train.ka_name.includes("TIDAK ANGKUT PENUMPANG"))
        .map((schedule: TrainSchedule) => {
          const arrival = moment(schedule.time_est, 'HH:mm');
          const relative = arrival.diff(now, 'minutes');
          return {
            ...schedule,
            time_est_minute: relative,
            time_est: arrival.format('HH:mm'),
          };
        });

      setTrainSchedule(TrainSchedule);
    }
    finally {
      dismissLoading();
    }
  }

  const handleRefresh = (e: CustomEvent) => {
    getStationSchedule(selectedStation!);
    e.detail.complete();
  }

  useEffect(() => {
    getStation();
  }, []);

  useEffect(() => {
    getStationSchedule(selectedStation!);
  }, [selectedStation]);

  const getStringTime = (time: number) => {
    if (time === 0) {
      return "Tiba";
    }
    return `${time} min`;
  };

  const selectStation =
    <IonCard>
      <IonCardContent style={{ padding: '10px' }}>
        <IonSelect
          label="Pilih stasiun"
          interface='action-sheet'
          onIonChange={(e) => setSelectedStation(e.detail.value)}
        >
          {station.map((sta, idx) => (
            <IonSelectOption key={idx} value={sta} >
              {sta.sta_name}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonCardContent>
    </IonCard>

  // const spinner = <IonLoading message="Loading..." spinner="circles"  />

  const trainScheduleList = trainSchedule.map((train, idx) => (
    <IonCard key={idx} style={{ backgroundColor: train.color }}>
      <IonCardContent style={{ padding: '5px' }}>
        <IonGrid>
          <IonRow>
            <IonCol size='7'>
              <IonText color={"light"}>
                <b>{train.dest}</b>
              </IonText>
            </IonCol>
            <IonCol size='5'>
              <IonText color={"light"} >
                {train.time_est} - {getStringTime(train.time_est_minute)}
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  ));

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        {/* {spinner} */}
        {selectStation}
        {trainScheduleList}
      </IonContent>
    </IonPage>
  );
};

export default Main;
