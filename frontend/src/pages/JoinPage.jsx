import React from 'react'
import {useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import { joinSubjectByToken } from '../services/subjectService';

function JoinPage() {

    const {token} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();

    useEffect(()=>{

        const join = async () => {
            const subjectId = joinSubjectByToken(token, user.uid);

            if(!subjectId){
                alert("Invalid or expired link");
                navigate("/");
                return;
            }

            navigate(`/subject/${subjectId}`);

        };

            if(token && user){
                join();
                //if user hoi and token bhi joi, subject completely load thai jai then only run join function
            }

    },[token, user]);

  return <div> Joining subject...</div>;
}

export default JoinPage