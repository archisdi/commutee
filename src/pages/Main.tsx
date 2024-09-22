import moment from 'moment';

import { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonCard, IonCardContent, IonText, IonRow, IonCol, IonGrid,
  IonRefresher, IonRefresherContent, useIonLoading, IonModal, IonHeader, IonToolbar,
  IonTitle, IonButtons, IonButton, IonIcon, IonList, IonItem, IonSearchbar, IonItemDivider,
  IonItemGroup, IonLabel
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

const Main: React.FC = () => {
  const now = moment();
  const [showLoading, dismissLoading] = useIonLoading();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [station, setStation] = useState<Station[]>([]);
  const [trainSchedule, setTrainSchedule] = useState<TrainSchedule[]>([]);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [historyStation, setHistoryStation] = useState<Station[]>([]);

  const getStation = async () => {
    const cacheStations = localStorage.getItem('stations');
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
    localStorage.setItem('stations', JSON.stringify(stations));
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

  const getHistoryStation = () => {
    const history = localStorage.getItem('historyStation');
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
    localStorage.setItem('selectedStation', JSON.stringify(station));
  }

  const loadLastSelectedStation = () => {
    const lastSelectedStation = localStorage.getItem('selectedStation');
    if (lastSelectedStation) {
      setSelectedStation(JSON.parse(lastSelectedStation));
    }
  }

  const handleSearchStation = (ev: CustomEvent) => {
    const searchValue = ev.detail.value;
    let filteredStation: Station[] = JSON.parse(localStorage.getItem('stations')!);

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

      if (history.length > 5) {
        history.shift();
      }

      localStorage.setItem('historyStation', JSON.stringify(history));
      setHistoryStation(history);
    }
  }

  useEffect(() => {
    loadLastSelectedStation();
    getStation();
    getHistoryStation();
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

  const renderStationHistoryList = () => {
    if (!historyStation.length) return null;
    return (
      <IonList>
        <IonItemGroup>
          <IonItemDivider>
            <IonLabel>Terakhir Dipilih</IonLabel>
          </IonItemDivider>
          {historyStation.map((station) => (
            <IonItem key={station.sta_id} onClick={() => handleSelectStation(station)}>
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
          {station.filter(s => !historyMap[s.sta_id]).map((station) => (
            <IonItem key={station.sta_id} onClick={() => handleSelectStation(station)}>
              {station.sta_name}
            </IonItem>
          ))}
        </IonItemGroup>
      </IonList>
    )
  }

  const selectStationModal =
    <IonModal isOpen={isSearchOpen}>
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

  const schedules = trainSchedule.map((train, idx) => (
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
      <IonContent>
        <Frame>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>
          {selectStationModal}
          {stations}
          {schedules}
        </Frame>
      </IonContent>
    </IonPage>
  );
};

export default Main;
