import React from 'react';
import { IonCol, IonRow } from '@ionic/react';

const Frame: React.FC<any> = (props) => <IonRow>
    <IonCol sizeMd="4" sizeLg="4" sizeXl="4" offsetMd="4" offsetLg="4" offsetXl="4">
        {props.children}
    </IonCol>
</IonRow>;

export default Frame;
