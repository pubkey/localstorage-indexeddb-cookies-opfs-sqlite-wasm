import * as React from "react";

export function ProcessBlockIndicator() {
    const [transform, setTransform] = React.useState('');
    let style = {
        marginLeft: 100,
        width: 30,
        height: 30,
        backgroundColor: 'grey',
        transform
    }


    React.useEffect(() => {
        var spinnerDivAngle = 0;
        const interval = setInterval(() => {
            spinnerDivAngle = spinnerDivAngle + 1;
            spinnerDivAngle = spinnerDivAngle % 360;
            setTransform('rotate(' + spinnerDivAngle + 'deg)');
        }, 0);

        return () => clearInterval(interval);
    }, []);


    return <div style={{
        borderStyle: 'solid',
        padding: 20,
        position: 'fixed',
        right: 0,
        bottom: 0,
        backgroundColor: 'white'
    }}>
        <span>This spinner is propelled by JavaScript and visually indicates when the JavaScript process is blocked:</span>
        <br />
        <br />
        <div id="cpi-spinner" style={style}></div>

    </div>;
}
