import React, {useState} from 'react';
import checkmark from "../assets/checkmark.png"


export function Checkbox({ onToggle }) {
    var [state, setState] = useState(false);

    function handleToggle() {
        setState(!state);
        onToggle(state);
    }

    return (
        <button onClick={handleToggle} style={{ alignItems: "center", justifyContent: "center", width: "20px", height: "20px", padding: "10px", backgroundColor: "white", borderRadius: "20%", display: "flex"}}>
            {state ? (<img src={checkmark} style={{ width: "20px", height: "auto", padding: 0, margin: 0}}  alt={"checkbox"}/>) : null}
        </button>
    )
}


// export class Checkbox extends React.Component {
//     constructor({ onToggle }) {
//         super();
//         const {state, setState} = this.props;
//         this.state = state;
//
//         this.handleToggle = function() {
//             setState(!state);
//             onToggle(state);
//         }
//     }
//
//     render() {
//         const {state} = this.state
//         return (
//             <button onClick={this.handleToggle} style={{ alignItems: "center", justifyContent: "center", width: "20px", height: "20px", padding: "10px", backgroundColor: "white", borderRadius: "20%", display: "flex"}}>
//                 {state ? (<img src={checkmark} style={{ width: "20px", height: "auto", padding: 0, margin: 0}}  alt={"checkbox"}/>) : null}
//             </button>
//         )
//     }
// }

