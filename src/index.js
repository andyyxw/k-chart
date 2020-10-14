
class KChart {
  constructor (config) {
    this.ctx = this.makeHighRes(config.id)
    // 时间 开盘价 收盘价 最低价 最高价
    this.dataSource = config.data
    const statistics = this.splitData()
    // 基本绘图配置
    const options = {
      chartZone: [50, 50, 1300, 600], // 坐标系的区域
      yAxisLabel: ['2100', '2150', '2200', '2250', '2300', '2350'], // y轴坐标
      xAxisLabel: statistics.categoryData, // x轴坐标
      data: statistics.values
    }
    options.yMax = Number(options.yAxisLabel[options.yAxisLabel.length - 1])
    options.yMin = Number(options.yAxisLabel[0])
    this.options = options

    this.render()
  }

  /**
   * 适应高清屏幕
   */
  makeHighRes (canvas) {
    const ctx = canvas.getContext('2d')
    // Get the device pixel ratio, falling back to 1.
    const dpr = window.devicePixelRatio || window.webkitDevicePixelRatio || window.mozDevicePixelRatio || 1
    // Get the size of the canvas in CSS pixels.
    const oldWidth = canvas.width
    const oldHeight = canvas.height
    // 根据dpr，扩大canvas画布的像素，使1个canvas像素和1个物理像素相等
    // 要设置canvas的画布大小，使用的是 canvas.width 和 canvas.height；
    // 要设置画布的实际渲染大小，使用的 style 属性或CSS设置的 width 和height，只是简单的对画布进行缩放。
    canvas.width = Math.round(oldWidth * dpr)
    canvas.height = Math.round(oldHeight * dpr)
    canvas.style.width = oldWidth + 'px'
    canvas.style.height = oldHeight + 'px'
    // 由于画布扩大，canvas的坐标系也跟着扩大，如果按照原先的坐标系绘图内容会缩小，所以需要将绘制比例放大
    ctx.scale(dpr, dpr)
    return ctx
  }

  /**
   * 处理数据
   */
  splitData () {
    const categoryData = []
    const values = []
    this.dataSource.forEach((item) => {
      categoryData.push(item[0])
      values.push(item.slice(1))
    })
    return { categoryData, values }
  }

  /**
   * 绘制坐标轴
   */
  drawAxis () {
    const { chartZone } = this.options
    this.ctx.strokeWidth = 4
    this.ctx.strokeStyle = '#353535'
    this.ctx.moveTo(chartZone[0], chartZone[1])
    this.ctx.lineTo(chartZone[0], chartZone[3]) // 画y轴
    this.ctx.lineTo(chartZone[2], chartZone[3]) // 画x轴
    this.ctx.stroke()
  }

  /**
   * 绘制y轴坐标
   */
  drawYLabels () {
    const { chartZone, yAxisLabel } = this.options
    const labels = yAxisLabel
    const yLength = chartZone[3] - chartZone[1]
    const gap = yLength / (labels.length - 1) // 坐标点之间的间隔

    labels.forEach((label, index) => {
    // 绘制坐标文字
      const height = chartZone[3] - index * gap
      // this.ctx.font = '16px'
      this.ctx.textAlign = 'right'
      this.ctx.fillText(label, chartZone[0] - 16, height + 3)
      // 绘制小间隔
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#353535'
      this.ctx.moveTo(chartZone[0] - 10, height)
      this.ctx.lineTo(chartZone[0], height)
      this.ctx.stroke()
      // 绘制辅助线
      if (index === 0) return // 排除x轴
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#eaeaea'
      this.ctx.moveTo(chartZone[0], height)
      this.ctx.lineTo(chartZone[2], height)
      this.ctx.stroke()
    })
  }

  /**
   * 绘制x轴坐标
   */
  drawXLabels () {
    const { xAxisLabel, chartZone } = this.options
    const labels = xAxisLabel
    const xLength = chartZone[2] - chartZone[0]
    const gap = xLength / labels.length // 坐标点之间的间隔

    labels.forEach((label, index) => {
      const width = chartZone[0] + (index + 1) * gap
      if (index % 4 === 0) {
        this.ctx.strokeStyle = '#eaeaea'
        this.ctx.font = '18px'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(label, width, chartZone[3] + 20)
      }
      // 绘制小间隔
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#353535'
      this.ctx.moveTo(width, chartZone[3])
      this.ctx.lineTo(width, chartZone[3] + 5)
      this.ctx.stroke()
    })
  }

  /**
   * 绘制数据
   */
  drawData () {
    const { data, chartZone, xAxisLabel } = this.options
    const xLength = chartZone[2] - chartZone[0]
    const gap = xLength / xAxisLabel.length
    const openingPriceCoords = []
    const closingPriceCoords = []

    data.forEach((item, index) => {
    // 获取绘图颜色
      const color = this.getColor(item)
      this.ctx.strokeStyle = this.ctx.fillStyle = color
      // 计算绘制中心点x坐标
      const activeX = chartZone[0] + (index + 1) * gap
      // 绘制最高最低线;
      this.ctx.beginPath()
      this.ctx.moveTo(activeX, this.transCoord(item[2]))
      this.ctx.lineTo(activeX, this.transCoord(item[3]))
      this.ctx.closePath()
      this.ctx.stroke()

      const openingPrice = this.transCoord(item[0]) // 开盘价
      const closingPrice = this.transCoord(item[1]) // 收盘价
      openingPriceCoords.push([activeX, openingPrice])
      closingPriceCoords.push([activeX, closingPrice])

      // 绘制开盘收盘矩形
      if (item[0] >= item[1]) {
        this.ctx.fillRect(activeX - 5, openingPrice, 10, closingPrice - openingPrice)
      } else {
        this.ctx.fillRect(activeX - 5, closingPrice, 10, openingPrice - closingPrice)
      }
    })

    // 绘制曲线图
    // drawCurve(openingPriceCoords, '#f9bb2d') // 开盘价曲线图
    this.drawCurve(closingPriceCoords, 'blue') // 收盘价曲线图
  }

  /**
   * 绘制曲线图
   */
  drawCurve (data, style) {
    let lastPoint = data[0] // 缓存上一条线的终点

    let index = 1
    const step = () => {
      const item = data[index]

      const ctrlPoint = item // 当前数据点为本条线的控制点
      const next = data[index + 1] || item
      // 计算每段曲线终点
      const nextPoint = [(item[0] + next[0]) / 2, (item[1] + next[1]) / 2] // 两个数据点的中点
      const nextPoin2 = [(nextPoint[0] + next[0]) / 2, (nextPoint[1] + next[1]) / 2]

      this.ctx.beginPath()
      this.ctx.moveTo(...lastPoint)
      this.ctx.quadraticCurveTo(
        ...ctrlPoint,
        ...nextPoin2
      )
      this.ctx.strokeStyle = style
      this.ctx.stroke()
      lastPoint = nextPoin2

      if (index < data.length - 1) {
        index++
        requestAnimationFrame(step)
      }
    }

    step()
  }

  /**
   * 根据K线图的数据计算绘图颜色
   */
  getColor (data) {
    return data[0] >= data[1] ? '#1abc9c' : '#DA5961'
  }

  /**
   * 从可视坐标系坐标转换为canvas坐标系坐标
   */
  transCoord (coord) {
    const { chartZone, yMin, yMax } = this.options
    return chartZone[3] - (coord - yMin) * (chartZone[3] - chartZone[1]) / (yMax - yMin)
  }

  render () {
    this.drawAxis() // 绘制坐标轴
    this.drawYLabels() // 绘制y轴坐标
    this.drawXLabels() // 绘制x轴坐标
    this.drawData()// 绘制K线图
  }
}

const chart = new KChart({
  id: document.getElementById('canvas'),
  data: [
    ['2013/4/3', 2232.69, 2225.29, 2217.25, 2241.34],
    ['2013/4/8', 2196.24, 2211.59, 2180.67, 2212.59],
    ['2013/4/9', 2215.47, 2225.77, 2215.47, 2234.73],
    ['2013/4/10', 2224.93, 2226.13, 2212.56, 2233.04],
    ['2013/4/11', 2236.98, 2219.55, 2217.26, 2242.48],
    ['2013/4/12', 2218.09, 2206.78, 2204.44, 2226.26],
    ['2013/4/15', 2199.91, 2181.94, 2177.39, 2204.99],
    ['2013/4/16', 2169.63, 2194.85, 2165.78, 2196.43],
    ['2013/4/17', 2195.03, 2193.8, 2178.47, 2197.51],
    ['2013/4/18', 2181.82, 2197.6, 2175.44, 2206.03],
    ['2013/4/19', 2201.12, 2244.64, 2200.58, 2250.11],
    ['2013/4/22', 2236.4, 2242.17, 2232.26, 2245.12],
    ['2013/4/23', 2242.62, 2184.54, 2182.81, 2242.62],
    ['2013/4/24', 2187.35, 2218.32, 2184.11, 2226.12],
    ['2013/4/25', 2213.19, 2199.31, 2191.85, 2224.63],
    ['2013/4/26', 2203.89, 2177.91, 2173.86, 2210.58],
    ['2013/5/2', 2170.78, 2174.12, 2161.14, 2179.65],
    ['2013/5/3', 2179.05, 2205.5, 2179.05, 2222.81],
    ['2013/5/6', 2212.5, 2231.17, 2212.5, 2236.07],
    ['2013/5/7', 2227.86, 2235.57, 2219.44, 2240.26],
    ['2013/5/8', 2242.39, 2246.3, 2235.42, 2255.21],
    ['2013/5/9', 2246.96, 2232.97, 2221.38, 2247.86],
    ['2013/5/10', 2228.82, 2246.83, 2225.81, 2247.67],
    ['2013/5/13', 2247.68, 2241.92, 2231.36, 2250.85],
    ['2013/5/14', 2238.9, 2217.01, 2205.87, 2239.93],
    ['2013/5/15', 2217.09, 2224.8, 2213.58, 2225.19],
    ['2013/5/16', 2221.34, 2251.81, 2210.77, 2252.87],
    ['2013/5/17', 2249.81, 2282.87, 2248.41, 2288.09],
    ['2013/5/20', 2286.33, 2299.99, 2281.9, 2309.39],
    ['2013/5/21', 2297.11, 2305.11, 2290.12, 2305.3],
    ['2013/5/22', 2303.75, 2302.4, 2292.43, 2314.18],
    ['2013/5/23', 2293.81, 2275.67, 2274.1, 2304.95],
    ['2013/5/24', 2281.45, 2288.53, 2270.25, 2292.59],
    ['2013/5/27', 2286.66, 2293.08, 2283.94, 2301.7],
    ['2013/5/28', 2293.4, 2321.32, 2281.47, 2322.1],
    ['2013/5/29', 2323.54, 2324.02, 2321.17, 2334.33],
    ['2013/5/30', 2316.25, 2317.75, 2310.49, 2325.72],
    ['2013/5/31', 2320.74, 2300.59, 2299.37, 2325.53],
    ['2013/6/3', 2300.21, 2299.25, 2294.11, 2313.43],
    ['2013/6/4', 2297.1, 2272.42, 2264.76, 2297.1],
    ['2013/6/5', 2270.71, 2270.93, 2260.87, 2276.86],
    ['2013/6/6', 2264.43, 2242.11, 2240.07, 2266.69],
    ['2013/6/7', 2242.26, 2210.9, 2205.07, 2250.63],
    ['2013/6/8', 2190.1, 2148.35, 2126.22, 2190.1],
    ['2013/6/9', 2290.1, 2248.35, 2226.22, 2290.1]
  ]
})
