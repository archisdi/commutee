import moment from 'moment';

import { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonText, IonButton, IonIcon, IonAccordion, IonRow, IonCol, IonGrid } from '@ionic/react';
import { trainOutline } from 'ionicons/icons';

import './Tab1.css';


const JWT_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiMDYzNWIyOGMzYzg3YTY3ZTRjYWE4YTI0MjYxZGYwYzIxNjYzODA4NWM2NWU4ZjhiYzQ4OGNlM2JiZThmYWNmODU4YzY0YmI0MjgyM2EwOTUiLCJpYXQiOjE3MjI2MTc1MTQsIm5iZiI6MTcyMjYxNzUxNCwiZXhwIjoxNzU0MTUzNTE0LCJzdWIiOiI1Iiwic2NvcGVzIjpbXX0.Jz_sedcMtaZJ4dj0eWVc4_pr_wUQ3s1-UgpopFGhEmJt_iGzj6BdnOEEhcDDdIz-gydQL5ek0S_36v5h6P_X3OQyII3JmHp1SEDJMwrcy4FCY63-jGnhPBb4sprqUFruDRFSEIs1cNQ-3rv3qRDzJtGYc_bAkl2MfgZj85bvt2DDwBWPraZuCCkwz2fJvox-6qz6P7iK9YdQq8AjJfuNdl7t_1hMHixmtDG0KooVnfBV7PoChxvcWvs8FOmtYRdqD7RSEIoOXym2kcwqK-rmbWf9VuPQCN5gjLPimL4t2TbifBg5RWNIAAuHLcYzea48i3okbhkqGGlYTk3iVMU6Hf_Jruns1WJr3A961bd4rny62lNXyGPgNLRJJKedCs5lmtUTr4gZRec4Pz_MqDzlEYC3QzRAOZv0Ergp8-W1Vrv5gYyYNr-YQNdZ01mc7JH72N2dpU9G00K5kYxlcXDNVh8520-R-MrxYbmiFGVlNF2BzEH8qq6Ko9m0jT0NiKEOjetwegrbNdNq_oN4KmHvw2sHkGWY06rUeciYJMhBF1JZuRjj3JTwBUBVXcYZMFtwUAoikVByzKuaZZeTo1AtCiSjejSHNdpLxyKk_SFUzog5MOkUN1ktAhFnBFoz6SlWAJBJIS-lHYsdFLSug2YNiaNllkOUsDbYkiDtmPc9XWc";
const BASE_URL = "https://api-partner.krl.co.id";
const DEFAULT_STATION = "JNG";
const DELTA_MINUTES = 30;

interface TrainInfo {
  train_id: string;
  ka_name: string;
  route_name: string;
  dest: string;
  time_est: string;
  color: string;
  dest_time: string;
  time_est_minute: number;
}

const Tab1: React.FC = () => {
  const now = moment();
  const [trainInfo, setTrainInfo] = useState<TrainInfo[]>([]);
  const [station, setStation] = useState<string>(DEFAULT_STATION);

  useEffect(() => {
    const timefrom = moment().format('HH:mm');
    const timeto = moment().add(DELTA_MINUTES, 'minutes').format('HH:mm');

    fetch(`${BASE_URL}/krlweb/v1/schedule?stationid=${station}&timefrom=${timefrom}&timeto=${timeto}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    })
      .then(data => data.json())
      .then(({ data }) => {
        const trainInfo = data
          .filter((train: TrainInfo) => {
            return !train.ka_name.includes("TIDAK ANGKUT PENUMPANG");
          }).map((train: TrainInfo) => {
            const arrival = moment(train.time_est, 'HH:mm');
            const relative = arrival.diff(now, 'minutes');

            train.time_est_minute = relative;
            train.time_est = arrival.format('HH:mm');

            return train;
          });

        setTrainInfo(trainInfo);
      })

  }, []);

  const getStringTime = (time: number) => {
    if (time === 0) {
      return "Tiba";
    }

    return `${time} min`;
  };

  return (
    <IonPage>
      {/* <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
        </IonToolbar>
      </IonHeader> */}
      <IonContent fullscreen>
        {/* <IonHeader collapse="condense"> */}
        {/* <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar> */}
        {/* </IonHeader> */}

        {/* select station */}

        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle>Stasiun</IonCardSubtitle>
            <IonCardTitle>{DEFAULT_STATION}</IonCardTitle>
          </IonCardHeader>
        </IonCard>


        {trainInfo.map((train, idx) => (
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
                    <IonText color={"light"}>
                      <p>
                        {train.time_est} - {getStringTime(train.time_est_minute)}
                      </p>
                    </IonText>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        ))}

      </IonContent>
    </IonPage>
  );
};

export default Tab1;
