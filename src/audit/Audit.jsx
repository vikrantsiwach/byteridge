import { useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import { userActions } from '_store';

export { Audit };

function Audit() {
    const users = useSelector(x => x.users.list);
    const filteredUsers = useSelector(x => x.users.filteredList)

    const newUsers = filteredUsers?.value.length ? filteredUsers : users
    const dispatch = useDispatch();
    const id = useId()

    const pages = Array.from({length: Math.ceil(users?.value?.length/10)}, (_, i) => i + 1)

    useEffect(() => {
        dispatch(userActions.getAll());
    }, []);

    return (
        <div>
            <div style={{display: "flex"}}>
                <input type='search' onChange={(e) => dispatch(userActions.filter(e.target.value))}></input>
                <div style={{marginLeft: "5rem"}}>
                    {pages.map((d,i) => {
                        return <button key={`${id}-${i}`} style={{marginLeft: "0.25rem"}} onClick={() => dispatch(userActions.pagination(i+1))}>{d}</button>
                    })}
                </div>
            </div>
            <h1>Auditor Page</h1>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }} onClick={() => dispatch(userActions.sort("firstName"))}>First Name</th>
                        <th style={{ width: '30%' }} onClick={() => dispatch(userActions.sort("lastName"))}>Last Name</th>
                        <th style={{ width: '30%' }} onClick={() => dispatch(userActions.sort("username"))}>Username</th>
                    </tr>
                </thead>
                <tbody>
                    {newUsers?.value?.map(user =>
                        <tr key={user.id}>
                            <td>{user.firstName}</td>
                            <td>{user.lastName}</td>
                            <td>{user.username}</td>
                        </tr>
                    )}
                    {newUsers?.loading &&
                        <tr>
                            <td colSpan="4" className="text-center">
                                <span className="spinner-border spinner-border-lg align-center"></span>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    );
}
