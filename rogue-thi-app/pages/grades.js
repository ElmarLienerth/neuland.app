import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useRouter } from 'next/router'

import ReactPlaceholder from 'react-placeholder'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'

import styles from '../styles/Exams.module.css'

import AppNavbar, { extractThemeFromCookie } from '../components/AppNavbar'
import { callWithSession, NoSessionError } from '../lib/thi-backend/thi-session-handler'
import { getGrades } from '../lib/thi-backend/thi-api-client'

export default function Exams ({ theme }) {
  const router = useRouter()
  const [grades, setGrades] = useState(null)
  const [missingGrades, setMissingGrades] = useState(null)

  useEffect(async () => {
    try {
      const gradeList = await callWithSession(getGrades)

      gradeList.forEach(x => {
        if (x.anrech === '*' && x.note === '') {
          x.note = 'E*'
        }
      })

      const deduplicatedGrades = gradeList
        .filter((x, i) => x.ects || !gradeList.some((y, j) => i !== j && x.titel.trim() === y.titel.trim()))

      const finishedGrades = deduplicatedGrades.filter(x => x.note)
      setGrades(finishedGrades)

      setMissingGrades(
        deduplicatedGrades.filter(x => !finishedGrades.some(y => x.titel.trim() === y.titel.trim()))
      )
    } catch (e) {
      if (e instanceof NoSessionError) {
        router.replace('/login')
      } else if (e.message === 'Query not possible') {
        // according to the original developers,
        // { status: -102, data: "Query not possible" }
        // means that the transcripts are currently being updated

        console.error(e)
        alert('Noten sind vorübergehend nicht verfügbar. Eventuell werden die Notenblätter gerade aktualisiert.')
      } else {
        console.error(e)
        alert(e)
      }
    }
  }, [])

  return (
    <Container>
      <AppNavbar title="Noten & Fächer" theme={theme} />

      <ListGroup>
        <h4 className={styles.heading}>
          Noten
        </h4>

        <ReactPlaceholder type="text" rows={10} color="#eeeeee" ready={grades}>
          {grades && grades.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                {item.titel} ({item.stg})<br />

                <div className={styles.details}>
                  Note: {item.note.replace('*', ' (angerechnet)')}<br />
                  ECTS: {item.ects || '(keine)'}
                </div>
              </div>
            </ListGroup.Item>
          )}
        </ReactPlaceholder>
      </ListGroup>

      <ListGroup>
        <h4 className={styles.heading}>
          Ausstehende Fächer
        </h4>

        <ReactPlaceholder type="text" rows={10} color="#eeeeee" ready={missingGrades}>
          {missingGrades && missingGrades.map((item, idx) =>
            <ListGroup.Item key={idx} className={styles.item}>
              <div className={styles.left}>
                {item.titel} ({item.stg}) <br />

                <div className={styles.details}>
                  Frist: {item.frist || '(keine)'}<br />
                  ECTS: {item.ects || '(keine)'}
                </div>
              </div>
            </ListGroup.Item>
          )}
        </ReactPlaceholder>
      </ListGroup>
      <br />
    </Container>
  )
}

Exams.propTypes = {
  theme: PropTypes.string
}

Exams.getInitialProps = function ({ req }) {
  return {
    theme: extractThemeFromCookie(req)
  }
}
