import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Imobiliarias from './Imobiliarias/Imobiliarias'
import SuperUsers from './SuperUsers'

export default function SuperAdmin(){
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Imobiliarias/>} />
        <Route path="imobiliarias" element={<Imobiliarias/>} />
        <Route path="usuarios" element={<SuperUsers/>} />
      </Routes>
    </Layout>
  )
}
