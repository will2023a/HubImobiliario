import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Imobiliarias from './Imobiliarias/Imobiliarias'

export default function SuperAdmin(){
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Imobiliarias/>} />
        <Route path="imobiliarias" element={<Imobiliarias/>} />
      </Routes>
    </Layout>
  )
}
