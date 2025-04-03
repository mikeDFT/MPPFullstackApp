import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { IoMenu } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import { useGameData } from "@/context/GameDataContext.jsx";

export function SearchBar() {
    const { searchText, setSearchText } = useGameData();

    function menuClicked() {
        console.log("e");
    }
    function searchClicked() {
        console.log("f");
    }

    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1em",
            color: "white",
            padding: ".2rem",
            display: "flex",
            justifyContent: "space-between",
        }}>

            <button onClick={menuClicked} className="searchBarButton">
                <IoMenu/>
            </button>
            <FloatingLabel
                controlId="floatingInput"
                label="Search"
                style={{margin: 0, padding: 0,
                    color: "rgba(255, 255, 255, 0.4)",
                    fontWeight: "bold",}}
                value={searchText || null}
                onChange={(event) => {setSearchText(event.target.value)}}>

            <Form.Control type="Search" placeholder="Title"
                       style={{
                           backgroundColor: "#1F0D44",
                           border: 0,
                           color: "white",
                       }}/>
            </FloatingLabel>
            <button onClick={searchClicked} className="searchBarButton">
                <IoIosSearch/>
            </button>
        </div>
    )
}

