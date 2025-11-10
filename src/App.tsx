import { IonApp, setupIonicReact } from '@ionic/react';
import { useEffect } from 'react';
import Commuter from './pages/Commuter';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

/* Firebase */
import { analytics } from './firebase/config';
import { logEvent } from 'firebase/analytics';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    // Log app initialization
    if (analytics) {
      logEvent(analytics, 'app_open');
    }
  }, []);

  return (
    <IonApp>
      <Commuter />
    </IonApp>
  );
};

export default App;
