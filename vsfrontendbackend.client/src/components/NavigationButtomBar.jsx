import logo from '../assets/AmethystIcon.png';
import { Checkbox } from "@/components/Checkbox.jsx"

export function NavigationButtomBar() {
    return (
        <div style={{ width: "100%", height: "10%", margin: "2rem 0 0 0"}}>
            <hr/>
            <div style={{display: "flex", justifyContent: "space-between"}}>
                <a href={"/"} style={{margin: "1rem"}}>
                    <div style={{float: "left", display: "flex", paddingLeft: "50px"}}>
                        <img src={logo} alt="logo" height={50} style={{ padding: "10px 10px 10px 0px" }} />
                        <h3 style={{ padding: "10px 20px 0px 0px" }}>Amethyst</h3>
                    </div>
                </a>

                <div style={{float: "right", paddingRight: "50px"}}>
                    {/*<a href={"/"}>*/}
                    {/*    <p>*/}
                    {/*        Home*/}
                    {/*    </p>*/}
                    {/*</a>*/}

                    {/*<a href={"/"}>*/}
                    {/*    <p className={"navBarButton"}>*/}
                    {/*        Store*/}
                    {/*    </p>*/}
                    {/*</a>*/}

                    {/*<a href={"profile"}>*/}
                    {/*    <p className={"navBarButton"}>*/}
                    {/*        Profile*/}
                    {/*    </p>*/}
                    {/*</a>*/}

                    {/*<a href={"cart"} className={"viewCartButton"}>*/}
                    {/*    <p className={"navBarButton"}>*/}
                    {/*        View Cart*/}
                    {/*    </p>*/}
                    {/*</a>*/}
                </div>
            </div>
        </div>
    )
}