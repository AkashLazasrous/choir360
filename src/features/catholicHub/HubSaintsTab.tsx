import React, { useState } from 'react';
import { Search } from 'lucide-react';

// ─── Static Saints Database (June focus) ────────────────────────────────────
const SAINTS_DATABASE = [
  { date: 'June 1',  name: 'St. Justin Martyr',         feast: 'Memorial',    bio: 'Early Christian apologist who defended the faith before Roman emperors. Martyred around 165 AD.', patronOf: 'Philosophers, Lecturers' },
  { date: 'June 2',  name: 'Sts. Marcellinus & Peter',  feast: 'Memorial',    bio: 'Roman martyrs under Emperor Diocletian. Marcellinus was a priest, Peter an exorcist.', patronOf: 'Exorcists' },
  { date: 'June 3',  name: 'St. Charles Lwanga',        feast: 'Memorial',    bio: 'Leader of the Uganda Martyrs who died for refusing to renounce faith. Patron of African youth.', patronOf: 'Youth of Africa, Catholic Action' },
  { date: 'June 5',  name: 'St. Boniface',              feast: 'Memorial',    bio: 'Apostle of Germany, Archbishop of Mainz. Martyred in 754 AD while preparing confirmands.', patronOf: 'Germany, Brewers, File Cutters' },
  { date: 'June 6',  name: 'St. Norbert',               feast: 'Memorial',    bio: 'Archbishop of Magdeburg, founder of the Premonstratensians (Norbertines). Defender of the Eucharist.', patronOf: 'Bohemia, Peace' },
  { date: 'June 9',  name: 'St. Ephrem the Syrian',     feast: 'Memorial',    bio: 'Deacon, theologian, and poet. Called the "Harp of the Holy Spirit" for his beautiful hymns.', patronOf: 'Spiritual Directors, Spiritual Leaders' },
  { date: 'June 11', name: 'St. Barnabas',              feast: 'Feast',       bio: 'Apostle and companion of St. Paul. His name means "Son of Encouragement." Martyred in Cyprus.', patronOf: 'Cyprus, Antioch' },
  { date: 'June 13', name: 'St. Anthony of Padua',      feast: 'Memorial',    bio: 'Doctor of the Church, Franciscan friar. One of the most beloved saints. Patron of lost things.', patronOf: 'Lost Items, Poor, Travelers, Infertile Women' },
  { date: 'June 19', name: 'St. Romuald',               feast: 'Memorial',    bio: 'Founder of the Camaldolese Order. Established many monasteries and hermitages in Italy.', patronOf: 'Camaldolese Order' },
  { date: 'June 21', name: 'St. Aloysius Gonzaga',      feast: 'Memorial',    bio: 'Jesuit scholastic who died at 23 caring for plague victims. Patron of Catholic youth.', patronOf: 'Catholic Youth, Jesuit Scholastics' },
  { date: 'June 22', name: 'St. John Fisher & St. Thomas More', feast: 'Memorial', bio: 'English martyrs beheaded by Henry VIII for refusing to accept royal supremacy over the Church.', patronOf: 'Bishops, Statesmen, Lawyers' },
  { date: 'June 24', name: 'Nativity of St. John the Baptist', feast: 'Solemnity', bio: 'Forerunner of Christ. His birth was miraculous; his whole life pointed to the Messiah.', patronOf: 'Baptism, Jordan, French Canada' },
  { date: 'June 27', name: 'St. Cyril of Alexandria',   feast: 'Memorial',    bio: 'Patriarch of Alexandria and Doctor of the Church. Championed the title "Theotokos" for Mary.', patronOf: 'Alexandria' },
  { date: 'June 28', name: 'St. Irenaeus',              feast: 'Memorial',    bio: 'Bishop of Lyon and Doctor of the Church. Defender against Gnosticism. Author of Against Heresies.', patronOf: 'Apologists' },
  { date: 'June 29', name: 'Sts. Peter & Paul',         feast: 'Solemnity',   bio: 'The twin pillars of the Church. Peter, first Pope; Paul, Apostle to the Gentiles. Both martyred in Rome.', patronOf: 'The Universal Church, Rome, Fishermen' },
  { date: 'June 30', name: 'First Martyrs of Rome',     feast: 'Optional Memorial', bio: 'Christians killed by Nero after the Great Fire of Rome in 64 AD, on false charges of arson.', patronOf: 'Martyrs' },
];

export const HubSaintsTab: React.FC = () => {
  const [saintSearch, setSaintSearch] = useState('');

  const filteredSaints = SAINTS_DATABASE.filter(
    (s) =>
      s.name.toLowerCase().includes(saintSearch.toLowerCase()) ||
      s.date.toLowerCase().includes(saintSearch.toLowerCase()) ||
      s.patronOf.toLowerCase().includes(saintSearch.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={saintSearch}
          onChange={(e) => setSaintSearch(e.target.value)}
          placeholder="Search saints by name, date, or patronage..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500 min-h-[44px]"
        />
      </div>
      <div className="space-y-2">
        {filteredSaints.map((saint) => (
          <div
            key={saint.name}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
                ✦
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{saint.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      saint.feast === 'Solemnity'
                        ? 'bg-amber-100 text-amber-800'
                        : saint.feast === 'Feast'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {saint.feast}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-amber-700">{saint.date}</p>
                <p className="mt-1 text-xs text-slate-600">{saint.bio}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  <span className="font-bold">Patron of:</span> {saint.patronOf}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
