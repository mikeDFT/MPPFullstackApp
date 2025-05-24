import logo from '../assets/AmethystIcon.png';
import { StatusIndicator } from "./StatusIndicator.jsx";

export function NavigationTopBar() {
    return (
        <div style={{ width: "100%", height: "10%", margin: "2rem 0 0 0"}}>
            {/* <h1><StatusIndicator/></h1> */}
            <ul>
                <a href={"/"}>
                    <div style={{float: "left", display: "flex", paddingLeft: "50px"}}>
                        <img src={logo} alt="logo" height={100} style={{ padding: "10px 20px 10px 0px" }} />
                            <p className={"title"}>Amethyst</p>
                    </div>
                </a>

                <div style={{float: "right", paddingRight: "50px"}}>
                    <a href={"/"}>
                        <p className={"navBarButton"}>
                            Home
                        </p>
                    </a>

                    <a href={"/"}>
                        <p className={"navBarButton"}>
                            Store
                        </p>
                    </a>

                    <a href={"profile"}>
                        <p className={"navBarButton"}>
                            Profile
                        </p>
                    </a>

                    <a href={"cart"} className={"viewCartButton"}>
                        <p className={"navBarButton"}>
                            View Cart
                        </p>
                    </a>
                </div>
            </ul>
        </div>
    )
}