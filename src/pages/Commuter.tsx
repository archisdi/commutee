import moment from 'moment';

import { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonCard, IonCardContent, IonText, IonRow, IonCol, IonGrid,
  IonRefresher, IonRefresherContent, IonModal, IonHeader, IonToolbar, IonSkeletonText,
  IonTitle, IonButtons, IonButton, IonIcon, IonList, IonItem, IonSearchbar, IonItemDivider,
  IonItemGroup, IonLabel,
} from '@ionic/react';

import { caretDownSharp } from 'ionicons/icons';

import Frame from '../components/Layout';

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

const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN;
const BASE_URL = "https://api-partner.krl.co.id";
const DELTA_MINUTES = 45;
const NON_COMMUTER_TRAIN_KEY = "TIDAK";
const TIME_RENDER_INTERVAL = 5000; /** 5 seconds */
const MAX_HISTORY_STATION = 4;
const SKELETON_COUNT = 5;

const LOCAL_STORAGE_KEY = {
  STATIONS: 'stations',
  SELECTED_STATION: 'selectedStation',
  HISTORY_STATION: 'historyStation'
} as const;

const Main: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [station, setStation] = useState<Station[]>([]);
  const [trainSchedule, setTrainSchedule] = useState<TrainSchedule[]>([]);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [historyStation, setHistoryStation] = useState<Station[]>([]);

  const [now, setNow] = useState(moment());

  const getStation = async () => {
    const cacheStations = localStorage.getItem(LOCAL_STORAGE_KEY.STATIONS);
    if (cacheStations) {
      setStation(JSON.parse(cacheStations));
      return;
    }

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
    localStorage.setItem(LOCAL_STORAGE_KEY.STATIONS, JSON.stringify(stations));
  }

  const getStationSchedule = async (station?: Station) => {
    if (!station) return;
    setIsLoading(true);
    try {
      const timefrom = moment().format('HH:mm');

      // if time to pass midnight, then set time to 23:59 to prevent error
      let timeto = moment().add(DELTA_MINUTES, 'minutes').format('HH:mm');
      if (moment(timeto, 'HH:mm').isBefore(moment(timefrom, 'HH:mm'))) {
        timeto = '23:59';
      }

      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }

      let { data } = await fetch(
        `${BASE_URL}/krlweb/v1/schedule?stationid=${station.sta_id}&timefrom=${timefrom}&timeto=${timeto}`,
        { headers: defaultHeaders }
      )
        .then(res => res.json());

      if (typeof data === 'string') {
        data = [];
      }

      const trainSchedule = data
        .filter((train: TrainSchedule) => !train.ka_name.includes(NON_COMMUTER_TRAIN_KEY))
        .map((schedule: TrainSchedule) => {
          const arrival = moment(schedule.time_est, 'HH:mm');
          const relative = arrival.diff(now, 'minutes');
          return {
            ...schedule,
            time_est_minute: relative,
            time_est: arrival.format('HH:mm'),
          };
        });

      setTrainSchedule(trainSchedule);
    }
    finally {
      setIsLoading(false);
    }
  }

  const getHistoryStation = () => {
    const history = localStorage.getItem(LOCAL_STORAGE_KEY.HISTORY_STATION);
    if (history) {
      setHistoryStation(JSON.parse(history));
    }
  }

  const handleRefresh = (e: CustomEvent) => {
    getStationSchedule(selectedStation!);
    e.detail.complete();
  }

  const selectStation = (station: Station) => {
    setSelectedStation(station);
    localStorage.setItem(LOCAL_STORAGE_KEY.SELECTED_STATION, JSON.stringify(station));
  }

  const loadLastSelectedStation = () => {
    const lastSelectedStation = localStorage.getItem(LOCAL_STORAGE_KEY.SELECTED_STATION);
    if (lastSelectedStation) {
      setSelectedStation(JSON.parse(lastSelectedStation));
    }
  }

  const handleSearchStation = (ev: CustomEvent) => {
    const searchValue = ev.detail.value;
    let filteredStation: Station[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY.STATIONS)!);

    if (searchValue) {
      filteredStation = filteredStation.filter((station) => {
        return station.sta_name.toLowerCase().includes(searchValue.toLowerCase());
      });
    }

    setStation(filteredStation);
  }

  const handleSelectStation = (station: Station, isHistory?: boolean) => {
    selectStation(station);
    setIsSearchOpen(false);

    /** reset filtered station */
    getStation();

    /** add to history */
    if (!isHistory) {
      const history = historyStation;
      const isExist = historyStation.find((sta) => sta.sta_id === station.sta_id);
      if (isExist) return;

      history.push(station);

      if (history.length >= MAX_HISTORY_STATION) {
        history.shift();
      }

      localStorage.setItem(LOCAL_STORAGE_KEY.HISTORY_STATION, JSON.stringify(history));
      setHistoryStation(history);
    }
  }

  const renderTime = (train: TrainSchedule) => {
    const arr = moment(train.time_est, 'HH:mm');
    const relative = moment(arr).diff(now, 'minutes');

    const routeStartStation = train.route_name.split('-')[0].trim();
    const isStartStation = routeStartStation === selectedStation?.sta_name;

    if (relative === 0) {
      return `${train.time_est} - ${isStartStation ? "Brgkt" : "Tiba"}`;
    }
    return `${train.time_est} - ${relative} min`;
  }

  useEffect(() => {
    loadLastSelectedStation();
    getStation();
    getHistoryStation();

    const interval = setInterval(() => {
      setNow(moment());
    }, TIME_RENDER_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getStationSchedule(selectedStation!);
  }, [selectedStation]);

  const renderStationHistoryList = () => {
    if (!historyStation.length) return null;
    return (
      <IonList>
        <IonItemGroup>
          <IonItemDivider>
            <IonLabel>Terakhir Dipilih</IonLabel>
          </IonItemDivider>
          {historyStation.map((station, idx) => (
            <IonItem key={`station-history-${idx}`} onClick={() => handleSelectStation(station)}>
              <IonRow>
                {station.sta_name}
              </IonRow>
            </IonItem>
          )).reverse()}
        </IonItemGroup>
      </IonList>
    )
  }

  const renderStationList = () => {
    const historyMap = historyStation.reduce((acc: any, station) => {
      acc[station.sta_id] = station;
      return acc;
    }, {});

    const divider = historyStation.length
      ? <IonItemDivider><IonLabel>Semua Stasiun</IonLabel></IonItemDivider>
      : null;

    return (
      <IonList>
        <IonItemGroup>
          {divider}
          {station.filter(s => !historyMap[s.sta_id]).map((station, idx) => (
            <IonItem key={`station-${idx}`} onClick={() => handleSelectStation(station)}>
              {station.sta_name}
            </IonItem>
          ))}
        </IonItemGroup>
      </IonList>
    )
  }

  const selectStationModal =
    <IonModal isOpen={isSearchOpen} onIonModalDidDismiss={() => { setIsSearchOpen(false) }}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pilih Stasiun</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setIsSearchOpen(false)}>Tutup</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSearchbar placeholder='Cari' debounce={500} onIonInput={(ev) => handleSearchStation(ev)} />
        {renderStationHistoryList()}
        {renderStationList()}
      </IonContent>
    </IonModal>

  const stations =
    <IonCard>
      <IonCardContent style={{ padding: '15px' }} onClick={() => { setIsSearchOpen(true) }}>
        <IonRow>
          <IonCol size='10'>
            <IonText>
              <b>{selectedStation ? `STASIUN ${selectedStation.sta_name}` : 'Pilih Stasiun'}</b>
            </IonText>
          </IonCol>
          <IonCol size='2' style={{ textAlign: 'right' }}>
            <IonIcon icon={caretDownSharp} />
          </IonCol>
        </IonRow>
      </IonCardContent>
    </IonCard>

  const schedules = trainSchedule
    .filter((train: TrainSchedule) => { /** filter only train that has not depart yet */
      const arrival = moment(train.time_est, 'HH:mm');
      return arrival.isAfter(now);
    })
    .map((train, idx) => (
      <IonCard key={`schedule-${idx}`} style={{ backgroundColor: train.color }}>
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
                  {renderTime(train)}
                </IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>
    ));

  const emptySchedule = selectedStation ? (
    <IonCard>
      <IonCardContent style={{ padding: '15px' }}>
        <IonText>Belum ada jadwal kereta</IonText>
      </IonCardContent>
    </IonCard>
  ) : null;

  const skeletonSchedule = Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
    <IonCard key={`skeleton-${idx}`}>
      <IonCardContent style={{ padding: '5px' }}>
        <IonGrid>
          <IonRow>
            <IonCol size='7'>
              <IonSkeletonText animated style={{ width: '100%' }} />
            </IonCol>
            <IonCol size='5'>
              <IonSkeletonText animated style={{ width: '100%' }} />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonCardContent>
    </IonCard>
  ));

  const renderedSchedule =
    isLoading ? skeletonSchedule : schedules.length ? schedules : emptySchedule;

  return (
    <IonPage>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <Frame>
          {selectStationModal}
          {stations}
          {renderedSchedule}
        </Frame>
      </IonContent>
    </IonPage>
  );
};

export default Main;
