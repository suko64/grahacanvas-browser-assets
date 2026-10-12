# Browser calculation provenance

DE440s numerical coefficients: NASA/JPL planetary and lunar ephemeris, original pinned kernel SHA-256 recorded in manifest.json. Date chunks retain binary64 coefficients without quantization; no horoscope lookup table. Reference: https://ssd.jpl.nasa.gov/doc/de440_de441.html

Chebyshev recurrence and apparent-position/light-time/relativity implementation adapted from jplephem 2.24 and Skyfield 1.54. MIT notices supplied in JPLEPHEM-LICENSE.txt and SKYFIELD-LICENSE.txt.

IAU 1976/1980/1982/1994 conventions and nutation coefficient data follow the validated ERFA path. BSD/SOFA notices supplied in ERFA-LICENSE.txt. No Swiss Ephemeris/AGPL dependency.

Motion samples preserve the existing Astronomy Engine Time.AddDays delta-T polynomial behavior; Astronomy Engine MIT notice is supplied in ASTRONOMY-ENGINE-LICENSE.txt. No Astronomy Engine planetary positions are used by this browser calculator.

Earth rotation values are an exact subset of the pinned Skyfield IERS-derived table used by the Python reference. Places are the existing ten validated GeoNames city-centre records. Scope is deliberately unchanged: India locations in manifest, 1974–2024, Asia/Kolkata civil clock.

This directory is private validation, not a deployed public calculator. Test inputs are synthetic validation records. Personal form fields stay in browser memory; name is not passed to the worker. Downloads carry no birth input and no calculation service is called.
